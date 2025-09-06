import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RecipeService } from './recipe.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { Recipe } from '@/database/entity/recipe.entity';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/enums/role.enum';

@ApiTags('레시피')
@Controller({ path: 'recipes', version: '1' })
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

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
      level: { type: 'string', example: '쉬움' },
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
}
