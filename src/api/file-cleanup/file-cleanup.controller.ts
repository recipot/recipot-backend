import {
  Controller,
  Get,
  Delete,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { FileCleanupService } from './file-cleanup.service';
import { GetOrphanedFilesResponseDto } from './dto/get-orphaned-files.dto';
import { GetS3FoldersResponseDto } from './dto/get-s3-folders.dto';
import {
  DeleteOrphanedFilesRequestDto,
  DeleteOrphanedFilesResponseDto,
} from './dto/delete-orphaned-files.dto';
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

  /**
   * S3 폴더 목록 조회
   * - 사용 가능한 모든 S3 폴더 반환
   */
  @Get('folders')
  @ApiOperation({
    summary: '[어드민] S3 폴더 목록 조회',
    description: 'S3에 존재하는 사용 가능한 1단계 폴더 목록을 조회합니다.',
  })
  @ApiSuccessResponse('S3 폴더 목록 조회 성공', {
    type: GetS3FoldersResponseDto,
  })
  @ApiErrorResponse(401, ERROR_CODES.AUTH_REQUIRED)
  @ApiErrorResponse(403, ERROR_CODES.AUTH_PERMISSION_DENIED)
  @ApiErrorResponse(500, ERROR_CODES.FILE_CLEANUP_FAILED)
  async getS3Folders(): Promise<GetS3FoldersResponseDto> {
    const folders = await this.fileCleanupService.getS3Folders();
    return { folders };
  }

  /**
   * 고아 파일 조회
   * - folder 쿼리 파라미터로 특정 폴더 지정
   */
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

  /**
   * 고아 파일 삭제
   * - 요청 본문의 keys 배열 기반으로 S3 파일 삭제
   * - 배치 삭제 (최대 1000개)
   */
  @Delete('orphaned-files')
  @ApiOperation({
    summary: '[어드민] 고아 파일 삭제',
    description: 'S3에서 지정한 고아 파일들을 삭제합니다. (최대 1000개)',
  })
  @ApiBody({
    type: DeleteOrphanedFilesRequestDto,
  })
  @ApiSuccessResponse('고아 파일 삭제 성공', {
    type: DeleteOrphanedFilesResponseDto,
  })
  @ApiErrorResponse(401, ERROR_CODES.AUTH_REQUIRED)
  @ApiErrorResponse(403, ERROR_CODES.AUTH_PERMISSION_DENIED)
  @ApiErrorResponse(500, ERROR_CODES.FILE_CLEANUP_FAILED)
  async deleteOrphanedFiles(
    @Body() dto: DeleteOrphanedFilesRequestDto,
  ): Promise<DeleteOrphanedFilesResponseDto> {
    return await this.fileCleanupService.deleteOrphanedFiles(dto.keys);
  }
}
