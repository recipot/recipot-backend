import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
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
import {
  CreateIngredientDtoTx,
  IngredientResponseDto,
} from './dto/create-ingredient.dto';
import { GetIngredientsResponseDto } from './dto/get-ingredients.dto';
import { JwtGuard } from '../auth/guards/auth.guard';
import { GetRestrictedIngredientsResponseDto } from './dto/get-restricted-ingredients.dto';
import {
  GetAdminIngredientsDto,
  GetAdminIngredientsResponseDto,
} from './dto/get-admin-ingredients.dto';

@ApiTags('재료')
@Controller({ path: 'ingredients', version: '1' })
@ApiBearerAuth('Authorization')
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  @Get()
  @UseGuards(JwtGuard)
  @ApiOperation({
    summary: '재료 목록 조회',
    description: '모든 재료를 조회합니다.',
  })
  @ApiSuccessResponse('재료 목록 조회 성공', {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            categoryId: { type: 'number', example: 1 },
            categoryName: { type: 'string', example: '해산물류' },
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: '고등어' },
            isUserRestricted: {
              type: 'boolean',
              example: false,
              description: '사용자가 못 먹는 재료 여부',
            },
          },
        },
      },
    },
  })
  async getIngredients(
    @Request() req: any,
  ): Promise<GetIngredientsResponseDto> {
    return await this.ingredientService.getIngredients(req.user.sub);
  }

  @Get('admin')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: '[어드민] 식재료 목록 조회',
    description:
      '식재료 목록을 페이지네이션하여 조회합니다. 카테고리 정보와 건강 정보를 포함합니다.',
  })
  @ApiSuccessResponse('[어드민] 식재료 목록 조회 성공', {
    type: GetAdminIngredientsResponseDto,
  })
  async getAdminIngredients(
    @Query() query: GetAdminIngredientsDto,
  ): Promise<GetAdminIngredientsResponseDto> {
    return await this.ingredientService.getAdminIngredients(query);
  }

  @Get('restricted')
  @UseGuards(JwtGuard)
  @ApiOperation({
    summary: '못 먹는 음식 목록 조회 (온보딩)',
    description: '사용자가 선택할 수 있는 제한 재료 목록을 반환합니다.',
  })
  @ApiSuccessResponse('못 먹는 음식 조회 성공', {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: '연어' },
            isUserRestricted: {
              type: 'boolean',
              example: false,
              description: '사용자가 선택한 못먹는 음식 여부',
            },
          },
        },
      },
    },
  })
  async getRestrictedIngredients(
    @Request() req: any,
  ): Promise<GetRestrictedIngredientsResponseDto> {
    return await this.ingredientService.getRestrictedIngredients(req.user.sub);
  }

  @Get('categories')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
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

  @Post('categories')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
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

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: '[어드민] 재료 생성',
    description: '새로운 재료를 건강 정보와 함께 데이터베이스에 생성합니다.',
  })
  @ApiBody({
    description: '생성할 재료의 데이터 (건강 정보 포함)',
    type: CreateIngredientDtoTx,
  })
  @ApiSuccessResponse('재료 생성 성공', {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: '고등어' },
        ingredient_category_id: { type: 'number', example: 1 },
        health_infos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              content: {
                type: 'string',
                example:
                  '오메가-3 지방산이 풍부하여 심혈관 건강에 도움이 됩니다.',
              },
            },
          },
        },
      },
    },
  })
  async createIngredient(
    @Body() dto: CreateIngredientDtoTx,
  ): Promise<IngredientResponseDto[]> {
    return this.ingredientService.createIngredient(dto);
  }
}
