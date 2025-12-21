import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeasoningService } from './seasoning.service';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/enums/role.enum';
import {
  CreateSeasoningDtoTx,
  SeasoningResponseDto,
} from './dto/create-seasoning.dto';
import {
  GetAdminSeasoningsDto,
  GetAdminSeasoningsResponseDto,
} from './dto/get-admin-seasonings.dto';
import { JwtGuard } from '../auth/guards/auth.guard';

@ApiTags('양념')
@Controller({ path: 'seasonings', version: '1' })
export class SeasoningController {
  constructor(private readonly seasoningService: SeasoningService) {}

  @Get('admin')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: '[어드민] 양념 목록 조회',
    description: '양념 목록을 페이지네이션하여 조회합니다.',
  })
  @ApiSuccessResponse('[어드민] 양념 목록 조회 성공', {
    type: GetAdminSeasoningsResponseDto,
  })
  async getAdminSeasonings(
    @Query() query: GetAdminSeasoningsDto,
  ): Promise<GetAdminSeasoningsResponseDto> {
    return await this.seasoningService.getAdminSeasonings(query);
  }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: '[어드민] 양념 생성',
    description: '새로운 양념을 데이터베이스에 생성합니다.',
  })
  @ApiBody({
    description: '생성할 양념의 데이터',
    type: CreateSeasoningDtoTx,
  })
  @ApiSuccessResponse('양념 생성 성공', {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: '간장' },
        created_at: {
          type: 'string',
          format: 'date-time',
          example: '2025-09-06T12:15:00.000Z',
        },
        updated_at: {
          type: 'string',
          format: 'date-time',
          example: '2025-09-06T12:15:00.000Z',
        },
      },
    },
  })
  async createSeasoning(
    @Body() dto: CreateSeasoningDtoTx,
  ): Promise<SeasoningResponseDto[]> {
    return this.seasoningService.createSeasoning(dto);
  }
}
