import { ERROR_CODES } from '@/common/constants/error-codes';
import { ApiErrorResponse } from '@/common/decorators/api-error-response.decorator';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { Recipe } from '@/database/entity/recipe.entity';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../user/enums/role.enum';
import { CreateRecipeRecommendationConditionRequest } from './dto/create-recipe-recommend-request.dto';
import { CreateRecipeRecommendationConditionDto } from './dto/create-recipe-recommend.dto';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { GetRecipeRecommendationRequestDto } from './dto/get-recipe-recommendation-request.dto';
import { GetRecipeRecommendationResponseDto } from './dto/get-recipe-recommendation-response.dto';
import { GetRecipeRecommendationConditionsResponseDto } from './dto/get-recipe-recommends.dto';
import { GetRecipeResponseDto } from './dto/get-recipe.dto';
import { RecipeRecommendationConditionResponseDto } from './dto/recipe-recommend-response.dto';
import { UpdateRecipeRecommendationConditionDto } from './dto/update-recipe-recommend.dto';
import { RecipeRecommendationConditionService } from './recipe-recommend.service';
import { RecipeService } from './recipe.service';
import { RecipeRecommendationService } from './services/recipe-recommendation.service';

@ApiTags('레시피')
@Controller({ path: 'recipes', version: '1' })
export class RecipeController {
  constructor(
    private readonly recipeService: RecipeService,
    private readonly recipeRecommendationConditionService: RecipeRecommendationConditionService,
    private readonly recipeRecommendationService: RecipeRecommendationService,
  ) {}

  @Post('admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: '[어드민] 레시피 생성',
    description:
      '새로운 레시피를 생성합니다. 레시피와 함께 이미지, 재료, 양념, 조리도구, 요리순서, 건강포인트를 함께 등록할 수 있습니다.',
  })
  @ApiBody({
    description:
      '생성할 레시피의 데이터 (이미지, 재료, 양념, 조리도구, 요리순서, 건강포인트 포함)',
    type: CreateRecipeDto,
  })
  @ApiSuccessResponse('레시피 생성 성공', {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      title: { type: 'string', example: '간장 고등어 구이' },
      description: {
        type: 'string',
        example: '고소하고 짭짤한 간장 고등어 구이입니다. 밥반찬으로 최고!',
      },
      duration: { type: 'string', example: 'TIME01' },
      condition_id: { type: 'number', example: 1 },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-01-01T00:00:00.000Z',
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-01-01T00:00:00.000Z',
      },
      images: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            recipe_id: { type: 'number', example: 1 },
            image_url: {
              type: 'string',
              example: 'https://example.com/recipe.jpg',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T00:00:00.000Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T00:00:00.000Z',
            },
          },
        },
      },
      ingredients: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            recipe_id: { type: 'number', example: 1 },
            ingredient_id: { type: 'number', example: 1 },
            is_alternative: { type: 'boolean', example: false },
            amount: { type: 'string', example: '1마리' },
            ingredient: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: '고등어' },
              },
            },
          },
        },
      },
      seasonings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            recipe_id: { type: 'number', example: 1 },
            seasoning_id: { type: 'number', example: 1 },
            amount: { type: 'string', example: '2큰술' },
            seasoning: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: '간장' },
              },
            },
          },
        },
      },
      tools: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            recipe_id: { type: 'number', example: 1 },
            tool_id: { type: 'number', example: 1 },
            tool: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: '팬' },
              },
            },
          },
        },
      },
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            recipe_id: { type: 'number', example: 1 },
            order_num: { type: 'number', example: 1 },
            image_url: {
              type: 'string',
              example: 'https://example.com/step1.jpg',
            },
            summary: { type: 'string', example: '고등어 손질하기' },
            content: {
              type: 'string',
              example: '고등어를 깨끗이 씻어서 3등분으로 자릅니다.',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T00:00:00.000Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T00:00:00.000Z',
            },
          },
        },
      },
      healthPoints: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            recipe_id: { type: 'number', example: 1 },
            content: {
              type: 'string',
              example: '고등어의 오메가3가 심혈관 건강에 도움을 줍니다',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T00:00:00.000Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T00:00:00.000Z',
            },
          },
        },
      },
    },
  })
  async createRecipe(
    @Body() createRecipeDto: CreateRecipeDto,
  ): Promise<Recipe> {
    return await this.recipeService.createRecipe(createRecipeDto);
  }

  @Get(':id')
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: '레시피 상세 조회',
    description:
      '레시피 ID로 상세 정보를 조회합니다. 사용자의 재료 보유 상태가 포함됩니다.',
  })
  @ApiParam({
    name: 'id',
    description: '조회할 레시피 ID',
    type: 'number',
    example: 1,
  })
  @ApiSuccessResponse('레시피 상세 조회 성공', {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      title: { type: 'string', example: '간장 고등어 구이' },
      description: {
        type: 'string',
        example: '고소하고 짭짤한 간장 고등어 구이입니다. 밥반찬으로 최고!',
      },
      duration: { type: 'string', example: '30분' },
      condition: { type: 'string', example: '힘들어' },
      images: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            image_url: {
              type: 'string',
              example: 'https://example.com/recipe.jpg',
            },
          },
        },
      },
      ingredients: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: '고등어' },
            amount: { type: 'string', example: '1마리' },
            is_alternative: { type: 'boolean', example: false },
            ownership_status: {
              type: 'string',
              enum: ['owned', 'not_owned', 'alternative_unavailable'],
              example: 'owned',
            },
          },
        },
      },
      seasonings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: '간장' },
            amount: { type: 'string', example: '2큰술' },
          },
        },
      },
      tools: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: '프라이팬(원팬)' },
            image_url: {
              type: 'string',
              example: 'https://example.com/pan.jpg',
            },
          },
        },
      },
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            order_num: { type: 'number', example: 1 },
            summary: { type: 'string', example: '고등어 손질하기' },
            content: {
              type: 'string',
              example: '고등어를 깨끗이 씻어서 3등분으로 자릅니다.',
            },
            image_url: {
              type: 'string',
              example: 'https://example.com/step1.jpg',
            },
          },
        },
      },
      healthPoints: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              example: '고등어의 오메가3가 심혈관 건강에 도움을 줍니다',
            },
          },
        },
      },
      is_bookmarked: { type: 'boolean', example: true },
      is_completed: { type: 'boolean', example: false },
    },
  })
  @ApiErrorResponse(404, ERROR_CODES.RECIPE_NOT_FOUND)
  @ApiErrorResponse(401, ERROR_CODES.AUTH_REQUIRED)
  async getRecipe(
    @Param('id', ParseIntPipe) recipeId: number,
    @Request() req: any,
  ): Promise<GetRecipeResponseDto> {
    const userId = req.user.sub;
    return await this.recipeService.getRecipe(userId, recipeId);
  }

  // 레시피 추천 API
  @Post('recommendations')
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: '레시피 추천',
    description:
      '컨디션과 보유 재료를 기반으로 레시피를 추천합니다. Redis 캐싱을 통해 성능을 최적화합니다.',
  })
  @ApiBody({
    description: '레시피 추천 요청 데이터',
    type: GetRecipeRecommendationRequestDto,
  })
  @ApiSuccessResponse('레시피 추천 성공', {
    type: GetRecipeRecommendationResponseDto,
  })
  @ApiErrorResponse(400, ERROR_CODES.VALIDATION_ERROR)
  @ApiErrorResponse(401, ERROR_CODES.AUTH_REQUIRED)
  async getRecipeRecommendations(
    @Body() dto: GetRecipeRecommendationRequestDto,
    @Request() req: any,
  ): Promise<GetRecipeRecommendationResponseDto> {
    const userId = req.user?.sub;
    return await this.recipeRecommendationService.getRecipeRecommendationsWithCache(
      dto,
      userId,
    );
  }

  // 레시피 추천 관련 엔드포인트들
  @Get('recommendations/admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: '[어드민] 컨디션별 레시피 추천 목록 조회',
    description: '모든 컨디션별 레시피 추천을 조회합니다.',
  })
  @ApiSuccessResponse('컨디션별 레시피 추천 목록 조회 성공', {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            recipeId: { type: 'number', example: 1 },
            conditionId: { type: 'number', example: 1 },
            priorityScore: { type: 'number', example: 1.0 },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T00:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T00:00:00.000Z',
            },
          },
        },
      },
      total: { type: 'number', example: 10 },
    },
  })
  async getRecipeRecommendationConditions(): Promise<GetRecipeRecommendationConditionsResponseDto> {
    return await this.recipeRecommendationConditionService.getRecipeRecommendationConditions();
  }

  @Post('recommendations/admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: '[어드민] 컨디션별 레시피 추천 생성',
    description: '새로운 레시피 추천을 데이터베이스에 생성합니다.',
  })
  @ApiBody({
    description: '생성할 레시피 추천의 데이터',
    type: [CreateRecipeRecommendationConditionDto],
  })
  @ApiSuccessResponse('레시피 추천 생성 성공', {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        recipeId: { type: 'number', example: 1 },
        conditionId: { type: 'number', example: 1 },
        priorityScore: { type: 'number', example: 1.0 },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-01-01T00:00:00.000Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-01-01T00:00:00.000Z',
        },
      },
    },
  })
  async createRecipeRecommendationCondition(
    @Body()
    dto: CreateRecipeRecommendationConditionRequest,
  ): Promise<RecipeRecommendationConditionResponseDto[]> {
    return await this.recipeRecommendationConditionService.createRecipeRecommendationCondition(
      dto,
    );
  }

  @Patch('recommendations/admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: '[어드민] 컨디션별 레시피 추천 수정',
    description: '기존 컨디션별 레시피 추천의 우선순위 점수를 수정합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '레시피 추천 ID',
    example: 1,
  })
  @ApiBody({
    description: '수정할 레시피 추천의 데이터',
    type: UpdateRecipeRecommendationConditionDto,
  })
  @ApiSuccessResponse('레시피 추천 수정 성공', {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      recipeId: { type: 'number', example: 1 },
      conditionId: { type: 'number', example: 1 },
      priorityScore: { type: 'number', example: 1.5 },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-01-01T00:00:00.000Z',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  async updateRecipeRecommendationCondition(
    @Param('id') id: number,
    @Body() dto: UpdateRecipeRecommendationConditionDto,
  ): Promise<RecipeRecommendationConditionResponseDto> {
    return await this.recipeRecommendationConditionService.updateRecipeRecommendationCondition(
      id,
      dto,
    );
  }

  @Delete('recommendations/admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: '[어드민] 컨디션별 레시피 추천 삭제',
    description: '기존 컨디션별 레시피 추천을 삭제합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '레시피 추천 ID',
    example: 1,
  })
  @ApiSuccessResponse('레시피 추천 삭제 성공')
  async deleteRecipeRecommendationCondition(
    @Param('id')
    id: number,
  ): Promise<void> {
    return await this.recipeRecommendationConditionService.deleteRecipeRecommendationCondition(
      id,
    );
  }

  @Post('recommendations/admin/cache/invalidate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: '[어드민] 추천 캐시 무효화',
    description: '레시피 추천 캐시를 무효화합니다.',
  })
  @ApiSuccessResponse('캐시 무효화 성공')
  async invalidateRecommendationCache(): Promise<{ message: string }> {
    await this.recipeRecommendationService.invalidateAllCache();
    return { message: '추천 캐시가 무효화되었습니다.' };
  }

  @Post('recommendations/admin/cache/invalidate/:conditionId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: '[어드민] 특정 컨디션 추천 캐시 무효화',
    description: '특정 컨디션의 레시피 추천 캐시를 무효화합니다.',
  })
  @ApiParam({
    name: 'conditionId',
    description: '컨디션 ID',
    example: 1,
  })
  @ApiSuccessResponse('캐시 무효화 성공')
  async invalidateRecommendationCacheByCondition(
    @Param('conditionId', ParseIntPipe)
    conditionId: number,
  ): Promise<{ message: string }> {
    await this.recipeRecommendationService.invalidateCacheByCondition(
      conditionId,
    );
    return { message: `컨디션 ${conditionId}의 추천 캐시가 무효화되었습니다.` };
  }
}
