import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { IngredientService } from './ingredient.service';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { IngredientCategory } from '@/database/entity/ingredient-category.entity';
import { CreateIngredientCategoryDtoTx } from './dto/create-ingredient-category.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/enums/role.enum';
import {
  GetIngredientCategoriesDto,
  GetIngredientCategoriesResponseDto,
} from './dto/get-ingredient-category.dto';

@ApiTags('재료')
@Controller({ path: 'ingredients', version: '1' })
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  @Get('admin/categories')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: '[어드민] 재료 카테고리 조회',
    description: '재료 카테고리 목록을 페이지네이션하여 조회합니다.',
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
  @ApiSuccessResponse('재료 카테고리 조회 성공', {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: '해산물류' },
          },
        },
      },
    },
  })
  async getIngredientCategories(
    @Query() query: GetIngredientCategoriesDto,
  ): Promise<GetIngredientCategoriesResponseDto> {
    return this.ingredientService.getIngredientCategories(query);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('Authorization')
  @Post('admin/categories')
  @ApiOperation({
    summary: '[어드민] 재료 카테고리 생성',
    description: '새로운 재료 카테고리를 데이터베이스에 생성합니다.',
  })
  @ApiBody({
    description: '생성할 재료 카테고리의 데이터',
    type: CreateIngredientCategoryDtoTx,
  })
  @ApiSuccessResponse('재료 카테고리 생성 성공', {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: '해산물류' },
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
  async createIngredientCategory(
    @Body() dto: CreateIngredientCategoryDtoTx,
  ): Promise<IngredientCategory[]> {
    return this.ingredientService.createIngredientCategory(dto);
  }
}
