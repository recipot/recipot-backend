import { Body, Controller, Post, UseGuards } from '@nestjs/common';
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

@ApiTags('계량 가이드')
@Controller({ path: 'measurement-guides', version: '1' })
export class MeasurementGuideController {
  constructor(
    private readonly measurementGuideService: MeasurementGuideService,
  ) {}

  @Post('admin')
  @UseGuards(RolesGuard)
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
