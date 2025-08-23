import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CommonCodeService } from './common-code.service';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { CommonCode } from '@/database/entity/common-code.entity';
import { CreateCommonCodeDto } from './dto/create-common-code.dto';
import { PageQueryDto } from '@/common/dto/pagination.dto';
import { UpdateCommonCodeDto } from './dto/update-common-code.dto';

@ApiTags('공통 코드')
@Controller({ path: 'common-codes', version: '1' })
@ApiBearerAuth('Authorization')
export class CommonCodeController {
  constructor(private readonly commonCodeService: CommonCodeService) {}

  @Get()
  @ApiOperation({
    summary: '공통 코드 페이지네이션 조회',
    description: '모든 공통 코드를 페이지네이션하여 조회합니다.',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: '페이지 번호 (기본값: 1)',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: '페이지 당 항목 수 (기본값: 10)',
  })
  @ApiSuccessResponse('공통 코드 조회 성공', {
    type: 'array',
    items: {
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
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  async findCommonCodes(@Query() query: PageQueryDto): Promise<CommonCode[]> {
    return this.commonCodeService.findCommonCodes(query);
  }

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
    type: 'array', // 'object'에서 'array'로 수정
    items: {
      // 배열의 각 항목에 대한 정의
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
    },
  })
  async createCommonCode(
    @Body() dto: CreateCommonCodeDto[],
  ): Promise<CommonCode[]> {
    return this.commonCodeService.createCommonCode(dto);
  }

  @Put(':id')
  @ApiOperation({
    summary: '공통 코드 수정',
    description: 'ID로 특정 공통 코드를 찾아 내용을 수정합니다.',
  })
  @ApiParam({ name: 'id', description: '수정할 공통 코드의 ID', type: Number })
  @ApiBody({ type: UpdateCommonCodeDto })
  @ApiSuccessResponse('공통 코드 수정 성공', {
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
  async updateCommonCode(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommonCodeDto,
  ): Promise<CommonCode> {
    return this.commonCodeService.updateCommonCode(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '공통 코드 삭제',
    description:
      'ID로 특정 공통 코드를 찾아 삭제하고, 삭제된 데이터를 반환합니다 (Soft Delete).',
  })
  @ApiParam({ name: 'id', description: '삭제할 공통 코드의 ID', type: Number })
  @ApiSuccessResponse('공통 코드 삭제 성공', {
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
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
      deleted_at: { type: 'string', format: 'date-time' },
    },
  })
  async deleteCommonCode(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CommonCode> {
    return this.commonCodeService.deleteCommonCode(id);
  }
}
