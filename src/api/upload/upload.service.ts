import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as mime from 'mime-types';
import { CustomException } from '@/common/exceptions/custom-exception';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { LoggerFactoryService } from '@/common/logger/logger-factory.service';
import { CustomLoggerService } from '@/common/logger/custom-logger.service';

/**
 * @author 김진태 <realbig4199@gmail.com>
 * @description 파일 업로드 서비스
 */
@Injectable()
export class UploadService {
  private readonly s3: S3Client;
  private readonly logger: CustomLoggerService;
  private readonly cdnUrl: string;

  constructor(private readonly loggerFactory: LoggerFactoryService) {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.logger = this.loggerFactory.create(UploadService.name);
    this.cdnUrl = process.env.AWS_CDN_URL;
  }

  async uploadToS3(file: Express.Multer.File) {
    const ext = mime.extension(file.mimetype) || 'bin';
    const key = `uploads/${uuidv4()}.${ext}`;

    try {
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3.send(command);

      const url = this.cdnUrl
        ? `${this.cdnUrl}/${key}`
        : `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      this.logger.log(`File uploaded successfully: ${url}`);

      return {
        key,
        url,
      };
    } catch (error) {
      this.logger.error('Failed to upload file to S3', error);
      throw new CustomException(ERROR_CODES.FILE_UPLOAD_FAILED);
    }
  }
}
