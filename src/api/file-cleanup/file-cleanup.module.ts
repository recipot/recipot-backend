import { Module } from '@nestjs/common';
import { FileCleanupController } from './file-cleanup.controller';
import { FileCleanupService } from './file-cleanup.service';

/**
 * @author 김진태 <realbig4199@gmail.com>
 * @description 고아 파일 정리 모듈
 */
@Module({
  controllers: [FileCleanupController],
  providers: [FileCleanupService],
})
export class FileCleanupModule {}
