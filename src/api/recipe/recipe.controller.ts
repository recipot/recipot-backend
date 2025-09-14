import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RecipeService } from './recipe.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { Recipe } from '@/database/entity/recipe.entity';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/enums/role.enum';
import { ApiErrorResponse } from '@/common/decorators/api-error-response.decorator';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { GetRecipeResponseDto } from './dto/get-recipe.dto';

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
    const userId = req.user.userId;
    return await this.recipeService.getRecipe(userId, recipeId);
  }
}
