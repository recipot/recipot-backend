import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConditionService } from './condition.service';
import { GetConditionsResponseDto } from './dto/get-conditions.dto';
import {
  CreateConditionDtoTx,
  ConditionResponseDto,
} from './dto/create-condition.dto';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/enums/role.enum';
import { JwtGuard } from '../auth/guards/auth.guard';

@ApiTags('컨디션')
@Controller({ path: 'conditions', version: '1' })
@ApiBearerAuth('Authorization')
export class ConditionController {
  constructor(private readonly conditionService: ConditionService) {}

  @Get()
  @ApiOperation({
    summary: '컨디션 목록 조회',
    description: '모든 컨디션을 조회합니다.',
  })
  @ApiSuccessResponse('컨디션 목록 조회 성공', {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: '피로감' },
      },
    },
  })
  async getConditions(): Promise<GetConditionsResponseDto> {
    return await this.conditionService.getConditions();
  }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: '[어드민] 컨디션 생성',
    description: '새로운 컨디션을 데이터베이스에 생성합니다.',
  })
  @ApiBody({
    description: '생성할 컨디션의 데이터',
    type: CreateConditionDtoTx,
  })
  @ApiSuccessResponse('컨디션 생성 성공', {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: '기분좋아' },
        created_at: {
          type: 'string',
          format: 'date-time',
          example: '2025-09-13T12:15:00.000Z',
        },
        updated_at: {
          type: 'string',
          format: 'date-time',
          example: '2025-09-13T12:15:00.000Z',
        },
      },
    },
  })
  async createCondition(
    @Body() dto: CreateConditionDtoTx,
  ): Promise<ConditionResponseDto[]> {
    return await this.conditionService.createCondition(dto);
  }
}
