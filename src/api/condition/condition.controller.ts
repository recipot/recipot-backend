import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConditionService } from './condition.service';
import { GetConditionsResponseDto } from './dto/get-conditions.dto';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';

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
}
