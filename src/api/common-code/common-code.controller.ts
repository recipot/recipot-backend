import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommonCodeService } from './common-code.service';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { CommonCode } from '@/database/entity/common-code.entity';
import { CreateCommonCodeDto } from './dto/creeate-comon-code.dto';

@ApiTags('공통 코드')
@Controller({ path: 'common-codes', version: '1' })
@ApiBearerAuth('Authorization')
export class CommonCodeController {
  constructor(private readonly commonCodeService: CommonCodeService) {}

  @Post()
  @ApiOperation({
    summary: '공통 코드 생성',
    description: '새로운 공통 코드를 데이터베이스에 생성합니다.',
  })
  @ApiBody({
    description: '생성할 공통 코드의 데이터',
    type: [CreateCommonCodeDto],
  })
  @ApiSuccessResponse('공통 코드 생성 성공', {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      group_code: { type: 'string', example: 'C01' },
      group_code_name: { type: 'string', example: '소셜 로그인' },
      code: { type: 'string', example: 'C01001' },
      code_name: { type: 'string', example: '카카오' },
      group_name: { type: 'string', example: '소셜 로그인' },
      order_num: { type: 'number', example: 1 },
      is_active: { type: 'boolean', example: true },
      depth: { type: 'number', example: 2 },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-08-22T12:15:00.000Z',
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-08-22T12:15:00.000Z',
      },
    },
  })
  async createCommonCode(
    @Body() dto: CreateCommonCodeDto[],
  ): Promise<CommonCode[]> {
    return this.commonCodeService.createCommonCode(dto);
  }
}
