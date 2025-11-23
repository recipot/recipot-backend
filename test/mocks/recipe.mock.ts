import { Roles } from '@/api/auth/decorators/roles.decorator';
import { JwtGuard } from '@/api/auth/guards/auth.guard';
import { RolesGuard } from '@/api/auth/guards/roles.guard';
import { RecipeService } from '@/api/recipe/recipe.service';
import { cacheKey as buildCacheKey } from '@/api/recipe/utils/cache-key.util';
import { UserRole } from '@/api/user/enums/role.enum';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Module,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { MockJwtGuard } from './auth.mock';

const mockRecipeService = {
  getAllRecipes: async () => {
    return [
      {
        id: 1,
        title: '테스트 레시피 1',
        description: '테스트 레시피 설명 1',
        duration: 30,
        condition_info: {
          id: 1,
          name: '힘들어',
        },
        images: [
          {
            id: 1,
            image_url: 'https://example.com/recipe1.jpg',
          },
        ],
        ingredients: [
          {
            id: 1,
            name: '고등어',
            amount: '1마리',
            is_alternative: false,
          },
        ],
        seasonings: [
          {
            id: 1,
            name: '간장',
            amount: '2큰술',
          },
        ],
        tools: [
          {
            id: 1,
            name: '팬',
          },
        ],
        steps: [
          {
            order_num: 1,
            summary: '고등어를 손질합니다.',
            content: '고등어를 깨끗이 씻어서 3등분으로 자릅니다.',
            image_url: null,
          },
        ],
      },
    ];
  },
  getRecipe: async (userId: number, recipeId: number) => {
    return {
      id: recipeId,
      title: '테스트 레시피',
      description: '테스트 레시피 설명',
      duration: '30분',
      condition: {
        id: 1,
        name: '힘들어',
      },
      images: [
        {
          id: 1,
          imageUrl: 'https://example.com/recipe.jpg',
        },
      ],
      ingredients: [
        {
          id: 1,
          name: '고등어',
          amount: '1마리',
          is_alternative: false,
          ownership_status: 'owned',
        },
      ],
      seasonings: [
        {
          id: 1,
          name: '간장',
          amount: '2큰술',
        },
      ],
      tools: [
        {
          id: 1,
          name: '팬',
          imageUrl: 'https://example.com/pan.jpg',
        },
      ],
      steps: [
        {
          orderNum: 1,
          summary: '고등어를 손질합니다.',
        },
        {
          orderNum: 2,
          summary: '팬에 기름을 두르고 고등어를 굽습니다.',
        },
      ],
      healthPoints: [
        {
          content: '고등어는 오메가3가 풍부합니다.',
        },
      ],
    };
  },
};

// Mock 캐시 저장소 (메모리)
const mockCache = new Map<string, any>();

// Mock 추천 데이터 생성
const generateRecommendations = (conditionId: number, pantryIds: number[]) => {
  const allRecipes = Array.from({ length: 10 }, (_, i) => ({
    recipeId: i + 1,
    title: `추천 레시피 ${i + 1}`,
    description: `조건 ${conditionId}, 재료 ${pantryIds.length}개 기반 추천`,
    imageUrls: [`https://example.com/recipe-${i + 1}.jpg`],
  }));

  return {
    items: allRecipes,
    totalItems: allRecipes.length,
    computedAt: Date.now(),
  };
};

// 페이지네이션
const paginate = (items: any[], page: number, pageSize: number) => {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  const paginatedItems = items.slice(start, start + pageSize);

  return {
    items: paginatedItems,
    currentPage: page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
  };
};

// 테스트용 Mock Recipe Controller
@Controller({ path: 'recipes', version: '1' })
@UseGuards(MockJwtGuard)
export class MockRecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllRecipes() {
    return await this.recipeService.getAllRecipes();
  }

  @Get(':id')
  async getRecipe(
    @Param('id', ParseIntPipe) recipeId: number,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || 1;
    return await this.recipeService.getRecipe(userId, recipeId);
  }

  @Post('recommendations')
  @HttpCode(HttpStatus.OK)
  async getRecipeRecommendations(@Body() dto: any) {
    const { conditionId, pantryIds = [], page = 1, pageSize = 3 } = dto;

    // Validation
    if (!conditionId) {
      throw new BadRequestException('conditionId is required');
    }
    if (!Array.isArray(pantryIds)) {
      throw new BadRequestException('pantryIds must be an array');
    }
    if (page < 1) {
      throw new BadRequestException('page must be greater than 0');
    }
    if (pageSize < 1) {
      throw new BadRequestException('pageSize must be greater than 0');
    }

    // 캐시 키 생성 (실제 유틸과 동일 포맷 사용)
    const key = buildCacheKey(conditionId, pantryIds, []);

    // 캐시 확인
    let cachedData = mockCache.get(key);

    if (!cachedData) {
      // 캐시 미스: 새로 계산
      cachedData = generateRecommendations(conditionId, pantryIds);
      mockCache.set(key, cachedData);
    }

    // 페이지네이션 적용
    return paginate(cachedData.items, page, pageSize);
  }

  @Post('recommendations/admin/cache/invalidate')
  @HttpCode(HttpStatus.CREATED)
  async invalidateAllCache() {
    mockCache.clear();
    return { message: '전체 캐시 무효화 완료' };
  }

  @Post('recommendations/admin/cache/invalidate/:conditionId')
  @HttpCode(HttpStatus.CREATED)
  async invalidateConditionCache(
    @Param('conditionId', ParseIntPipe) conditionId: number,
  ) {
    // conditionId 기반 prefix로 삭제 (실서비스 패턴과 동일)
    const keysToDelete: string[] = [];
    mockCache.forEach((_, key) => {
      if (key.startsWith(`recommend:v1:c:${conditionId}:`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => mockCache.delete(key));

    return { message: `조건 ${conditionId} 캐시 무효화 완료` };
  }
}

@Module({
  controllers: [MockRecipeController],
  providers: [
    {
      provide: RecipeService,
      useValue: mockRecipeService,
    },
    {
      provide: JwtGuard,
      useClass: MockJwtGuard,
    },
    RolesGuard,
  ],
})
export class MockRecipeModule {}
