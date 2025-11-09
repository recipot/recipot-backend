import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { FileCleanupService } from './file-cleanup.service';
import { GetOrphanedFilesResponseDto } from './dto/get-orphaned-files.dto';
import { JwtGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/enums/role.enum';
import { ApiErrorResponse } from '@/common/decorators/api-error-response.decorator';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { ERROR_CODES } from '@/common/constants/error-codes';

/**
 * @author 김진태 <realbig4199@gmail.com>
 * @description 고아 파일 정리 컨트롤러
 */
@Controller('api/file-cleanup')
@ApiTags('File Cleanup')
@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('Authorization')
export class FileCleanupController {
  constructor(private fileCleanupService: FileCleanupService) {}

  @Get('orphaned-files')
  @ApiOperation({
    summary: '[어드민] 고아 파일 조회',
    description:
      'S3에 있지만 DB에서 참조하지 않는 고아 파일 목록을 조회합니다.',
  })
  @ApiQuery({
    name: 'folder',
    description: 'S3 폴더명 (예: recipes/)',
    required: true,
    example: 'recipes/',
  })
  @ApiSuccessResponse('고아 파일 조회 성공', {
    type: GetOrphanedFilesResponseDto,
  })
  @ApiErrorResponse(401, ERROR_CODES.AUTH_REQUIRED)
  @ApiErrorResponse(403, ERROR_CODES.AUTH_PERMISSION_DENIED)
  @ApiErrorResponse(500, ERROR_CODES.FILE_CLEANUP_FAILED)
  async getOrphanedFiles(
    @Query('folder') folder: string,
  ): Promise<GetOrphanedFilesResponseDto> {
    return await this.fileCleanupService.getOrphanedFiles(folder);
  }
}
