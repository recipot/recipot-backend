import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MeasurementGuideService } from './measurement-guide.service';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/enums/role.enum';
import {
  CreateMeasurementGuideRequestDto,
  MeasurementGuideResponseDto,
} from './dto/create-measurement-guide.dto';
import { GetMeasurementGuidesResponseDto } from './dto/get-measurement-guide.dto';
import { JwtGuard } from '../auth/guards/auth.guard';

@ApiTags('계량 가이드')
@Controller({ path: 'measurement-guides', version: '1' })
export class MeasurementGuideController {
  constructor(
    private readonly measurementGuideService: MeasurementGuideService,
  ) {}

  @Get()
  @UseGuards(JwtGuard)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: '계량 가이드 조회',
    description:
      '모든 계량 가이드를 조회합니다. (categoryCodeName 기준으로 정렬)',
  })
  @ApiSuccessResponse('계량 가이드 조회 성공', {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        example: {
          가루류: [
            {
              standard: '큰술',
              imageUrl: 'https://s3.../measurement-1.png',
              description: '밥숟가락을 기준으로 계량합니다',
            },
            {
              standard: '작은술',
              imageUrl: 'https://s3.../measurement-1.png',
              description: '작은 숟가락을 기준으로 계량합니다',
            },
          ],
          액체류: [
            {
              standard: '컵',
              imageUrl: 'https://s3.../measurement-2.png',
              description: '계량컵을 기준으로 계량합니다',
            },
          ],
        },
      },
    },
  })
  async getMeasurementGuides(): Promise<GetMeasurementGuidesResponseDto> {
    return this.measurementGuideService.getMeasurementGuides();
  }

  @Post('admin')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: '[어드민] 계량 가이드 생성',
    description: '새로운 계량 가이드를 데이터베이스에 생성합니다.',
  })
  @ApiBody({
    description: '생성할 계량 가이드의 데이터',
    type: CreateMeasurementGuideRequestDto,
  })
  @ApiSuccessResponse('계량 가이드 생성 성공', {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        categoryCode: { type: 'string', example: 'M01001' },
        standard: { type: 'string', example: '큰술' },
        imageUrl: {
          type: 'string',
          example: 'https://s3.../measurement-1.png',
        },
        description: {
          type: 'string',
          example: '밥숟가락을 기준으로 계량합니다',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-19T12:15:00.000Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-19T12:15:00.000Z',
        },
      },
    },
  })
  async createMeasurementGuide(
    @Body() dto: CreateMeasurementGuideRequestDto,
  ): Promise<MeasurementGuideResponseDto[]> {
    return this.measurementGuideService.createMeasurementGuide(dto);
  }
}
