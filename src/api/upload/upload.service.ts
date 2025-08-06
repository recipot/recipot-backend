import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as mime from 'mime-types';

/**
 * @author 김진태 <realbig4199@gmail.com>
 * @description 파일 업로드 서비스
 */
@Injectable()
export class UploadService {
  private readonly s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
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

      const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      return {
        key,
        url,
      };
    } catch (error) {
      console.error('[S3 업로드 실패]', error);
      throw new Error('파일 업로드 중 오류가 발생했습니다.');
    }
  }
}
