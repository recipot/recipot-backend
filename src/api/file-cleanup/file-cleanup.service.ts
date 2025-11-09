import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { CustomException } from '@/common/exceptions/custom-exception';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { LoggerFactoryService } from '@/common/logger/logger-factory.service';
import { CustomLoggerService } from '@/common/logger/custom-logger.service';
import { GetOrphanedFilesResponseDto } from './dto/get-orphaned-files.dto';

interface S3FileInfo {
  key: string;
  size: number;
  lastModified: Date;
}

/**
 * @author 김진태 <realbig4199@gmail.com>
 * @description 고아 파일 정리 서비스
 */
@Injectable()
export class FileCleanupService {
  private readonly s3: S3Client;
  private readonly logger: CustomLoggerService;

  constructor(
    private readonly loggerFactory: LoggerFactoryService,
    private readonly dataSource: DataSource,
  ) {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.logger = this.loggerFactory.create(FileCleanupService.name);
  }

  /**
   * S3에서 사용되지 않는 파일 조회
   * - folder 파라미터에 따라 동적으로 조회
   * - DB에서 사용 중인 모든 파일 URL 수집
   * - S3의 전체 파일 리스트 조회
   * - Set 기반 비교로 고아 파일 검출
   */
  async getOrphanedFiles(folder: string): Promise<GetOrphanedFilesResponseDto> {
    try {
      this.logger.log(`고아 파일 조회 시작 (folder: ${folder})`);

      const usedFileUrls = await this.collectUsedFileUrls();
      this.logger.log(`DB에서 사용 중인 파일 ${usedFileUrls.length}개 수집`);

      const s3Files = await this.listAllFilesFromS3(folder);
      this.logger.log(
        `S3에서 ${s3Files.length}개 파일 조회 (folder: ${folder})`,
      );

      const usedS3Keys = new Set(
        usedFileUrls.map((url) => this.extractS3Key(url)),
      );

      const orphanedFiles = s3Files.filter((file) => !usedS3Keys.has(file.key));

      this.logger.log(`고아 파일 ${orphanedFiles.length}개 감지`);

      const totalOrphanedSize = orphanedFiles.reduce(
        (sum, file) => sum + file.size,
        0,
      );

      const response: GetOrphanedFilesResponseDto = {
        totalOrphanedCount: orphanedFiles.length,
        orphanedFiles,
      };

      this.logger.log(
        `고아 파일 조회 완료: 총 ${totalOrphanedSize} bytes (folder: ${folder})`,
      );

      return response;
    } catch (error) {
      this.logger.error('고아 파일 조회 실패', error);
      throw new CustomException(ERROR_CODES.FILE_CLEANUP_FAILED);
    }
  }

  /**
   * DB 모든 테이블에서 imageUrl 필드를 가진 레코드의 URL 수집 (동적 쿼리)
   * - 모든 엔티티 메타데이터를 스캔
   * - imageUrl 컬럼이 있는 테이블만 조회
   * - 병렬 처리로 성능 최적화
   */
  private async collectUsedFileUrls(): Promise<string[]> {
    try {
      const urls: string[] = [];

      const entities = this.dataSource.entityMetadatas;

      const entitiesWithImageUrl = entities.filter((entity) =>
        entity.columns.some((column) => column.propertyName === 'imageUrl'),
      );

      this.logger.log(
        `imageUrl 필드를 가진 테이블 ${entitiesWithImageUrl.length}개 발견`,
      );

      const queries = entitiesWithImageUrl.map(async (entity) => {
        try {
          const results = await this.dataSource
            .getRepository(entity.target)
            .find({ select: ['imageUrl'] });

          const tableUrls = results.map((r: any) => r.imageUrl).filter(Boolean);

          this.logger.log(
            `${entity.tableName} 테이블: ${tableUrls.length}개 URL 수집`,
          );

          return tableUrls;
        } catch (error) {
          this.logger.error(
            `${entity.tableName} 테이블 조회 실패: ${error.message}`,
          );
          return [];
        }
      });

      const allResults = await Promise.all(queries);

      allResults.forEach((tableUrls) => {
        urls.push(...tableUrls);
      });

      this.logger.log(`총 ${urls.length}개의 고유 URL 수집 완료`);

      return urls;
    } catch (error) {
      this.logger.error('DB에서 파일 URL 수집 실패', error);
      throw new CustomException(ERROR_CODES.FILE_CLEANUP_FAILED);
    }
  }

  /**
   * S3의 전체 파일 목록 조회 (pagination 처리)
   * - folder 파라미터로 동적 폴더 지정
   * - ListObjectsV2 사용으로 최대 1000개씩 조회
   * - ContinuationToken으로 반복 조회
   * - 폴더 필터링: '/'로 끝나거나 size가 0인 경우 제외
   */
  private async listAllFilesFromS3(folder: string): Promise<S3FileInfo[]> {
    const allFiles: S3FileInfo[] = [];
    let continuationToken: string | undefined;

    try {
      do {
        const command = new ListObjectsV2Command({
          Bucket: process.env.AWS_S3_BUCKET,
          Prefix: folder,
          MaxKeys: 1000,
          ContinuationToken: continuationToken,
        });

        const response = await this.s3.send(command);

        if (response.Contents) {
          response.Contents.forEach((obj) => {
            if (!obj.Key!.endsWith('/') && obj.Size !== 0) {
              allFiles.push({
                key: obj.Key!,
                size: obj.Size || 0,
                lastModified: obj.LastModified || new Date(),
              });
            }
          });
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      return allFiles;
    } catch (error) {
      this.logger.error('S3 파일 목록 조회 실패', error);
      throw new CustomException(ERROR_CODES.FILE_LIST_FAILED);
    }
  }

  /**
   * CDN URL 또는 S3 URL을 S3 Key로 변환
   * 예) https://cdn.example.com/uploads/uuid.jpg → uploads/uuid.jpg
   */
  private extractS3Key(fileUrl: string): string {
    try {
      const cdnUrl = process.env.AWS_CDN_URL;

      if (cdnUrl && fileUrl.includes(cdnUrl)) {
        return fileUrl.replace(`${cdnUrl}/`, '');
      }

      if (fileUrl.includes('amazonaws.com')) {
        const url = new URL(fileUrl);
        return url.pathname.replace(/^\//, ''); // 맨 앞 / 제거
      }

      return fileUrl;
    } catch (error) {
      this.logger.error(`S3 Key 추출 실패: ${fileUrl}`, error);
      throw new CustomException(ERROR_CODES.FILE_CLEANUP_FAILED);
    }
  }
}
