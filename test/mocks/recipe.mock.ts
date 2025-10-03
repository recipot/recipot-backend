import { JwtGuard } from '@/api/auth/guards/auth.guard';
import { RecipeService } from '@/api/recipe/recipe.service';
import {
  Controller,
  Get,
  Module,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { MockJwtGuard } from './auth.mock';

const mockRecipeService = {
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

// 테스트용 Mock Recipe Controller
@Controller({ path: 'recipes', version: '1' })
@UseGuards(MockJwtGuard)
export class MockRecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Get(':id')
  async getRecipe(
    @Param('id', ParseIntPipe) recipeId: number,
    @Request() req: any,
  ) {
    // req.user가 없을 경우 기본값 1 사용
    const userId = req.user?.sub || 1;
    return await this.recipeService.getRecipe(userId, recipeId);
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
  ],
})
export class MockRecipeModule {}
