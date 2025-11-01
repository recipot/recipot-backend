import { JwtGuard } from '@/api/auth/guards/auth.guard';
import { ReviewController } from '@/api/review/review.controller';
import { UserRecipeReviewService } from '@/api/review/review.service';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { CustomException } from '@/common/exceptions/custom-exception';
import { UserRecipeReview } from '@/database/entity/user-recipe-review.entity';
import { Module } from '@nestjs/common';
import { MockJwtGuard } from './auth.mock';

// completedRecipeId별로 호출 횟수를 추적
const reviewCallCountMap = new Map<number, number>();

const mockUserRecipeReviewService = {
  createReview: async (userId: number, createDto: any) => {
    // 사용자 검증
    if (userId === 99999) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    const { completedRecipeId } = createDto;

    // completedRecipeId별 호출 횟수 증가
    const callCount = (reviewCallCountMap.get(completedRecipeId) || 0) + 1;
    reviewCallCountMap.set(completedRecipeId, callCount);

    // Mock 리뷰 생성
    const review: UserRecipeReview = {
      id: callCount, // 호출 횟수를 ID로 사용
      userId,
      userCompletedRecipeId: completedRecipeId,
      tasteCode: createDto.tasteCode ?? null,
      difficultyCode: createDto.difficultyCode ?? null,
      experienceCode: createDto.experienceCode ?? null,
      content: createDto.content ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserRecipeReview;

    return review;
  },
  getUserRecipeReviewPreparation: async (userId: number) => {
    if (userId === 99999) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    return {
      completionCount: 1,
      completionMessage: '1번째 해먹기 완료!',
      recipeName: '테스트 레시피',
      recipeImageUrl: 'https://example.com/recipe.jpg',
      tasteOptions: [
        { code: 'R03001', codeName: '맛있어요' },
        { code: 'R03002', codeName: '보통이에요' },
        { code: 'R03003', codeName: '별로에요' },
      ],
      difficultyOptions: [
        { code: 'R04001', codeName: '쉬워요' },
        { code: 'R04002', codeName: '보통이에요' },
        { code: 'R04003', codeName: '어려워요' },
      ],
      experienceOptions: [
        { code: 'R05001', codeName: '첫 시도' },
        { code: 'R05002', codeName: '여러 번 시도' },
      ],
    };
  },
};

@Module({
  controllers: [ReviewController],
  providers: [
    {
      provide: UserRecipeReviewService,
      useValue: mockUserRecipeReviewService,
    },
    {
      provide: JwtGuard,
      useClass: MockJwtGuard,
    },
  ],
  exports: [UserRecipeReviewService],
})
export class MockReviewModule {}
