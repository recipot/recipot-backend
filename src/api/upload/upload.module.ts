import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { MulterModule } from '@nestjs/platform-express';

/**
 * @author 김진태 <realbig4199@gmail.com>
 * @description 파일 업로드 모듈
 */
@Module({
  imports: [MulterModule.register({})],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
