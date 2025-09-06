import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { Public } from '@/api/auth/decorators/auth.decorators';

/**
 * @author 김진태 <realbig4199@gmail.com>
 * @description 파일 업로드 컨트롤러
 */
@ApiTags('Upload')
@Controller({ path: 'upload', version: '1' })
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: '파일 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiSuccessResponse('파일 업로드 성공', {
    type: 'string',
    example: 'https://s3.amazonaws.com/bucket/filename.jpg',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return await this.uploadService.uploadToS3(file);
  }
}
