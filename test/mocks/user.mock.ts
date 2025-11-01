import { JwtGuard } from '@/api/auth/guards/auth.guard';
import { UserRecipeArchiveController } from '@/api/user-recipe-archive/user-recipe-archive.controller';
import { UserRecipeArchiveService } from '@/api/user-recipe-archive/user-recipe-archive.service';
import { UserController } from '@/api/user/user.controller';
import { UserService } from '@/api/user/user.service';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { CustomException } from '@/common/exceptions/custom-exception';
import { Module } from '@nestjs/common';
import { MockJwtGuard } from './auth.mock';

// recipeId별로 호출 횟수를 추적하여 다른 completedRecipeId 반환
const cookingStartCountMap = new Map<number, number>();

const mockUserRecipeArchiveService = {
  createBookmark: async (_userId: number, createBookmarkDto: any) => {
    // 테스트 시나리오에 따라 다른 응답 반환
    if (createBookmarkDto.recipeId === 99999) {
      throw new CustomException(ERROR_CODES.RECIPE_NOT_FOUND); // 존재하지 않는 레시피 ID
    }
    if (createBookmarkDto.recipeId === 1) {
      // 이미 북마크한 레시피 - 두 번째 테스트용
      throw new CustomException(ERROR_CODES.BOOKMARK_ALREADY_EXISTS);
    }
    return true; // boolean 값으로 반환
  },
  deleteBookmark: async (_userId: number, recipeId: number) => {
    // 테스트 시나리오에 따라 다른 응답 반환
    if (recipeId === 99999) {
      throw new CustomException(ERROR_CODES.BOOKMARK_NOT_FOUND); // 존재하지 않는 북마크
    }
    return true; // boolean 값으로 반환
  },
  getBookmarks: async (_userId: number, query: any) => {
    // Mock 데이터: 페이지네이션 응답 구조와 동일하게
    const { page = 1, limit = 10 } = query;
    const pageNum = parseInt(page.toString(), 10);
    const limitNum = parseInt(limit.toString(), 10);

    const mockBookmarks = [
      {
        id: 1,
        userId: _userId,
        recipeId: 1,
        recipeTitle: '맛있는 김치찌개',
        recipeDescription: '매콤하고 시원한 김치찌개',
        recipeImages: ['https://example.com/kimchi.jpg'],
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        isBookmarked: true,
      },
      {
        id: 2,
        userId: _userId,
        recipeId: 2,
        recipeTitle: '간단한 계란볶음밥',
        recipeDescription: '집에서 쉽게 만들 수 있는 계란볶음밥',
        recipeImages: ['https://example.com/egg-rice.jpg'],
        createdAt: new Date('2024-01-02T00:00:00.000Z'),
        isBookmarked: true,
      },
      {
        id: 3,
        userId: _userId,
        recipeId: 3,
        recipeTitle: '부드러운 된장찌개',
        recipeDescription: '구수하고 부드러운 된장찌개',
        recipeImages: ['https://example.com/doenjang.jpg'],
        createdAt: new Date('2024-01-03T00:00:00.000Z'),
        isBookmarked: true,
      },
    ];

    // 페이지네이션 계산
    const total = mockBookmarks.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const items = mockBookmarks.slice(startIndex, endIndex);

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };
  },
  completeRecipe: async (userId: number, completedRecipeId: number) => {
    // 테스트 시나리오에 따라 다른 응답 반환
    if (userId === 99999) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND); // 존재하지 않는 사용자 ID
    }
    if (completedRecipeId === 99999) {
      throw new CustomException(ERROR_CODES.RECIPE_COOKING_NOT_STARTED); // 존재하지 않는 완료 레시피 ID
    }

    // 성공적인 완료
    return true;
  },
  startRecipeCooking: async (userId: number, recipeId: number) => {
    // 테스트 시나리오에 따라 다른 응답 반환
    if (userId === 99999) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND); // 존재하지 않는 사용자 ID
    }
    if (recipeId === 99999) {
      // 테스트에서 404를 기대하므로 NOT_FOUND 상태 코드로 예외 발생
      throw new CustomException(ERROR_CODES.RECIPE_NOT_FOUND, 404);
    }

    // recipeId별 호출 횟수 증가하여 다른 completedRecipeId 반환
    const callCount = (cookingStartCountMap.get(recipeId) || 0) + 1;
    cookingStartCountMap.set(recipeId, callCount);

    // 첫 번째 호출: 100, 두 번째: 101, 세 번째: 102 등의 ID 반환
    const completedRecipeId = 100 + callCount - 1;

    // 성공적인 요리 시작
    return { completedRecipeId };
  },
  getCompletedRecipes: async (_userId: number, query: any) => {
    // Mock 데이터: 페이지네이션 응답 구조와 동일하게
    const { page = 1, limit = 10 } = query;
    const pageNum = parseInt(page.toString(), 10);
    const limitNum = parseInt(limit.toString(), 10);

    const mockCompletedRecipes = [
      {
        id: 1,
        userId: _userId,
        recipeId: 1,
        recipeTitle: '완성된 김치찌개',
        recipeDescription: '매콤하고 시원한 김치찌개',
        recipeImages: ['https://example.com/kimchi-completed.jpg'],
        isCompleted: true,
        isReviewed: false,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        isBookmarked: true,
      },
      {
        id: 2,
        userId: _userId,
        recipeId: 2,
        recipeTitle: '완성된 계란볶음밥',
        recipeDescription: '집에서 쉽게 만들 수 있는 계란볶음밥',
        recipeImages: ['https://example.com/egg-rice-completed.jpg'],
        isCompleted: true,
        isReviewed: true,
        createdAt: new Date('2024-01-02T00:00:00.000Z'),
        isBookmarked: false,
      },
      {
        id: 3,
        userId: _userId,
        recipeId: 3,
        recipeTitle: '완성된 된장찌개',
        recipeDescription: '구수하고 부드러운 된장찌개',
        recipeImages: ['https://example.com/doenjang-completed.jpg'],
        isCompleted: true,
        isReviewed: false,
        createdAt: new Date('2024-01-03T00:00:00.000Z'),
        isBookmarked: true,
      },
    ];

    // 페이지네이션 계산
    const total = mockCompletedRecipes.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const items = mockCompletedRecipes.slice(startIndex, endIndex);

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };
  },
  getRecentRecipes: async (_userId: number, query: any) => {
    // Mock 데이터: 페이지네이션 응답 구조와 동일하게
    const { page = 1, limit = 10 } = query;
    const pageNum = parseInt(page.toString(), 10);
    const limitNum = parseInt(limit.toString(), 10);

    const mockRecentRecipes = [
      {
        id: 1,
        userId: _userId,
        recipeId: 1,
        recipeTitle: '최근 본 김치찌개',
        recipeDescription: '매콤하고 시원한 김치찌개',
        recipeImages: ['https://example.com/kimchi-recent.jpg'],
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        isBookmarked: false,
      },
      {
        id: 2,
        userId: _userId,
        recipeId: 2,
        recipeTitle: '최근 본 계란볶음밥',
        recipeDescription: '집에서 쉽게 만들 수 있는 계란볶음밥',
        recipeImages: ['https://example.com/egg-rice-recent.jpg'],
        createdAt: new Date('2024-01-02T00:00:00.000Z'),
        isBookmarked: true,
      },
      {
        id: 3,
        userId: _userId,
        recipeId: 3,
        recipeTitle: '최근 본 된장찌개',
        recipeDescription: '구수하고 부드러운 된장찌개',
        recipeImages: ['https://example.com/doenjang-recent.jpg'],
        createdAt: new Date('2024-01-03T00:00:00.000Z'),
        isBookmarked: false,
      },
    ];

    // 페이지네이션 계산
    const total = mockRecentRecipes.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const items = mockRecentRecipes.slice(startIndex, endIndex);

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };
  },
};

// recipeId별로 호출 횟수를 추적하여 다른 completedRecipeId 반환 (UserService용)
const userServiceCookingStartCountMap = new Map<number, number>();

const mockUserService = {
  startRecipeCooking: async (userId: number, recipeId: number) => {
    // 테스트 시나리오에 따라 다른 응답 반환
    if (userId === 99999) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND); // 존재하지 않는 사용자 ID
    }
    if (recipeId === 99999) {
      // 테스트에서 404를 기대하므로 NOT_FOUND 상태 코드로 예외 발생
      throw new CustomException(ERROR_CODES.RECIPE_NOT_FOUND, 404);
    }

    // recipeId별 호출 횟수 증가하여 다른 completedRecipeId 반환
    const callCount = (userServiceCookingStartCountMap.get(recipeId) || 0) + 1;
    userServiceCookingStartCountMap.set(recipeId, callCount);

    // 첫 번째 호출: 100, 두 번째: 101, 세 번째: 102 등의 ID 반환
    const completedRecipeId = 100 + callCount - 1;

    // 성공적인 요리 시작
    return { completedRecipeId };
  },
  createBookmark: async (_userId: number, createBookmarkDto: any) => {
    // 테스트 시나리오에 따라 다른 응답 반환
    if (createBookmarkDto.recipeId === 99999) {
      throw new CustomException(ERROR_CODES.RECIPE_NOT_FOUND); // 존재하지 않는 레시피 ID
    }
    if (createBookmarkDto.recipeId === 1) {
      // 이미 북마크한 레시피 - 두 번째 테스트용
      throw new CustomException(ERROR_CODES.BOOKMARK_ALREADY_EXISTS);
    }
    return true; // boolean 값으로 반환
  },
  deleteBookmark: async (_userId: number, recipeId: number) => {
    // 테스트 시나리오에 따라 다른 응답 반환
    if (recipeId === 99999) {
      throw new CustomException(ERROR_CODES.BOOKMARK_NOT_FOUND); // 존재하지 않는 북마크
    }
    return true; // boolean 값으로 반환
  },
  getBookmarks: async (_userId: number, query: any) => {
    // Mock 데이터: 페이지네이션 응답 구조와 동일하게
    const { page = 1, limit = 10 } = query;
    const pageNum = parseInt(page.toString(), 10);
    const limitNum = parseInt(limit.toString(), 10);

    const mockBookmarks = [
      {
        id: 1,
        userId: _userId,
        recipeId: 1,
        recipeTitle: '맛있는 김치찌개',
        recipeDescription: '매콤하고 시원한 김치찌개',
        recipeImages: ['https://example.com/kimchi.jpg'],
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      },
      {
        id: 2,
        userId: _userId,
        recipeId: 2,
        recipeTitle: '간단한 계란볶음밥',
        recipeDescription: '집에서 쉽게 만들 수 있는 계란볶음밥',
        recipeImages: ['https://example.com/egg-rice.jpg'],
        createdAt: new Date('2024-01-02T00:00:00.000Z'),
      },
      {
        id: 3,
        userId: _userId,
        recipeId: 3,
        recipeTitle: '부드러운 된장찌개',
        recipeDescription: '구수하고 부드러운 된장찌개',
        recipeImages: ['https://example.com/doenjang.jpg'],
        createdAt: new Date('2024-01-03T00:00:00.000Z'),
      },
    ];

    // 페이지네이션 계산
    const total = mockBookmarks.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const items = mockBookmarks.slice(startIndex, endIndex);

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };
  },
  getBookmarksByDate: async (_userId: number) => {
    // Mock 데이터: 실제 API 응답 구조와 동일하게
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    return [
      {
        date: today,
        bookmarks: [
          {
            id: 1,
            user_id: _userId,
            recipe_id: 101,
            recipe_description: '맛있는 김치찌개',
            recipe_duration: '30분',
            recipe_level: '초급',
            recipe_method: '찌개',
            recipe_washing_level: '보통',
            recipe_images: ['https://example.com/kimchi.jpg'],
            created_at: new Date(),
          },
          {
            id: 2,
            user_id: _userId,
            recipe_id: 102,
            recipe_description: '간단한 계란볶음밥',
            recipe_duration: '15분',
            recipe_level: '초급',
            recipe_method: '볶음',
            recipe_washing_level: '적음',
            recipe_images: ['https://example.com/egg-rice.jpg'],
            created_at: new Date(),
          },
        ],
      },
      {
        date: yesterday,
        bookmarks: [
          {
            id: 3,
            user_id: _userId,
            recipe_id: 103,
            recipe_description: '부드러운 된장찌개',
            recipe_duration: '25분',
            recipe_level: '초급',
            recipe_method: '찌개',
            recipe_washing_level: '보통',
            recipe_images: ['https://example.com/doenjang.jpg'],
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        ],
      },
    ];
  },
  completeRecipe: async (userId: number, completedRecipeId: number) => {
    // 테스트 시나리오에 따라 다른 응답 반환
    if (userId === 99999) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND); // 존재하지 않는 사용자 ID
    }
    if (completedRecipeId === 99999) {
      throw new CustomException(ERROR_CODES.RECIPE_COOKING_NOT_STARTED); // 존재하지 않는 완료 레시피 ID
    }

    // 성공적인 완료
    return true;
  },
};

@Module({
  controllers: [UserController, UserRecipeArchiveController],
  providers: [
    {
      provide: UserService,
      useValue: mockUserService,
    },
    {
      provide: UserRecipeArchiveService,
      useValue: mockUserRecipeArchiveService,
    },
    {
      provide: JwtGuard,
      useClass: MockJwtGuard,
    },
  ],
})
export class MockUserModule {}
