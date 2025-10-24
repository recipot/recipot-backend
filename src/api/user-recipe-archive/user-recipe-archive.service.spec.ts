import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CacheService } from '@/common/cache/cache.service';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { CustomException } from '@/common/exceptions/custom-exception';
import { LoggerFactoryService } from '@/common/logger/logger-factory.service';
import { CommonCode } from '@/database/entity/common-code.entity';
import { Recipe } from '@/database/entity/recipe.entity';
import { UserCompletedRecipe } from '@/database/entity/user-completed-recipe.entity';
import { UserRecentRecipes } from '@/database/entity/user-recent-recipes.entity';
import { UserRecipeBookmark } from '@/database/entity/user-recipe-bookmark.entity';
import { User } from '@/database/entity/user.entity';

import { GetCompletedRecipesRequestDto } from '@/api/user/dto/get-completed-recipes-request.dto';
import { UserCompletedRecipeCustomRepository } from '@/api/user/user-completed-recipe.custom-repository';
import { UserRecentRecipesCustomRepository } from '@/api/user/user-recent-recipes.custom-repository';
import { UserRecipeBookmarkCustomRepository } from '@/api/user/user-recipe-bookmark.custom-repository';
import { UserService } from '@/api/user/user.service';
import { UserRecipeArchiveService } from './user-recipe-archive.service';

describe('UserRecipeArchiveService', () => {
  let service: UserRecipeArchiveService;

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockUserRecipeBookmarkRepository = {
    delete: jest.fn(),
  };

  const mockUserCompletedRecipeRepository = {
    findOne: jest.fn(),
  };

  const mockRecipeRepository = {
    findOne: jest.fn(),
  };

  const mockUserRecentRecipesRepository = {
    findOne: jest.fn(),
    remove: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockCommonRepository = {
    findOne: jest.fn(),
  };

  const mockUserRecipeBookmarkCustomRepository = {
    existsByUserIdAndRecipeId: jest.fn(),
    save: jest.fn(),
    findBookmarksWithRecipeByUserIdPaginated: jest.fn(),
  };

  const mockUserRecentRecipesCustomRepository = {
    findRecentRecipesWithRecipeByUserIdPaginated: jest.fn(),
  };

  const mockUserCompletedRecipeCustomRepository = {
    findCompletedRecipesWithRecipeByUserIdPaginated: jest.fn(),
  };

  const mockUserService = {
    startRecipeCooking: jest.fn(),
    completeRecipe: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockLoggerFactory = {
    create: jest.fn().mockReturnValue({
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    }),
  };

  // 공통으로 사용할 Mock 데이터
  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    nickname: 'testuser',
    profileImageUrl: null,
    recipeCompleteCount: 0,
    isFirstEntry: true,
    level: 1,
    role: 'GENERAL' as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRecipeArchiveService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserRecipeBookmark),
          useValue: mockUserRecipeBookmarkRepository,
        },
        {
          provide: getRepositoryToken(UserCompletedRecipe),
          useValue: mockUserCompletedRecipeRepository,
        },
        {
          provide: getRepositoryToken(Recipe),
          useValue: mockRecipeRepository,
        },
        {
          provide: getRepositoryToken(UserRecentRecipes),
          useValue: mockUserRecentRecipesRepository,
        },
        {
          provide: getRepositoryToken(CommonCode),
          useValue: mockCommonRepository,
        },
        {
          provide: UserRecipeBookmarkCustomRepository,
          useValue: mockUserRecipeBookmarkCustomRepository,
        },
        {
          provide: UserRecentRecipesCustomRepository,
          useValue: mockUserRecentRecipesCustomRepository,
        },
        {
          provide: UserCompletedRecipeCustomRepository,
          useValue: mockUserCompletedRecipeCustomRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: LoggerFactoryService,
          useValue: mockLoggerFactory,
        },
      ],
    }).compile();

    service = module.get<UserRecipeArchiveService>(UserRecipeArchiveService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCompletedRecipes', () => {
    const userId = 1;
    const query: GetCompletedRecipesRequestDto = { page: 1, limit: 10 };

    it('성공적으로 완료한 레시피 목록을 조회해야 함', async () => {
      // Given
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const mockCompletedRecipes = {
        items: [
          {
            id: 1,
            userId: 1,
            recipeId: 1,
            recipeTitle: '완성된 김치찌개',
            recipeDescription: '매콤하고 시원한 김치찌개',
            recipeImages: ['https://example.com/kimchi-completed.jpg'],
            isCompleted: true,
            isReviewed: false,
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            isBookmarked: true,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockUserCompletedRecipeCustomRepository.findCompletedRecipesWithRecipeByUserIdPaginated.mockResolvedValue(
        mockCompletedRecipes,
      );

      // When
      const result = await service.getCompletedRecipes(userId, query);

      // Then
      expect(result).toEqual(mockCompletedRecipes);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(
        mockUserCompletedRecipeCustomRepository.findCompletedRecipesWithRecipeByUserIdPaginated,
      ).toHaveBeenCalledWith(userId, 1, 10);
    });

    it('사용자가 존재하지 않으면 USER_NOT_FOUND 예외를 발생시켜야 함', async () => {
      // Given
      mockUserRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(service.getCompletedRecipes(userId, query)).rejects.toThrow(
        new CustomException(ERROR_CODES.USER_NOT_FOUND),
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('페이지네이션 파라미터가 올바르게 전달되어야 함', async () => {
      // Given
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const customQuery = { page: 2, limit: 5 };
      const mockResult = {
        items: [],
        total: 0,
        page: 2,
        limit: 5,
        totalPages: 0,
      };
      mockUserCompletedRecipeCustomRepository.findCompletedRecipesWithRecipeByUserIdPaginated.mockResolvedValue(
        mockResult,
      );

      // When
      const result = await service.getCompletedRecipes(userId, customQuery);

      // Then
      expect(result).toEqual(mockResult);
      expect(
        mockUserCompletedRecipeCustomRepository.findCompletedRecipesWithRecipeByUserIdPaginated,
      ).toHaveBeenCalledWith(userId, 2, 5);
    });
  });

  describe('completeRecipe', () => {
    const userId = 1;
    const recipeId = 1;

    it('UserService의 completeRecipe 메서드를 호출해야 함', async () => {
      // Given
      mockUserService.completeRecipe.mockResolvedValue(true);

      // When
      const result = await service.completeRecipe(userId, recipeId);

      // Then
      expect(result).toBe(true);
      expect(mockUserService.completeRecipe).toHaveBeenCalledWith(
        userId,
        recipeId,
      );
    });
  });

  describe('getRecentRecipes', () => {
    const userId = 1;
    const query = { page: 1, limit: 10 };

    it('성공적으로 최근 본 레시피 목록을 조회해야 함', async () => {
      // Given
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const mockRecentRecipes = {
        items: [
          {
            id: 1,
            userId: 1,
            recipeId: 1,
            recipeTitle: '최근 본 김치찌개',
            recipeDescription: '매콤하고 시원한 김치찌개',
            recipeImages: ['https://example.com/kimchi-recent.jpg'],
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            isBookmarked: false,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockUserRecentRecipesCustomRepository.findRecentRecipesWithRecipeByUserIdPaginated.mockResolvedValue(
        mockRecentRecipes,
      );

      // When
      const result = await service.getRecentRecipes(userId, query);

      // Then
      expect(result).toEqual(mockRecentRecipes);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(
        mockUserRecentRecipesCustomRepository.findRecentRecipesWithRecipeByUserIdPaginated,
      ).toHaveBeenCalledWith(userId, 1, 10);
    });

    it('사용자가 존재하지 않으면 USER_NOT_FOUND 예외를 발생시켜야 함', async () => {
      // Given
      mockUserRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(service.getRecentRecipes(userId, query)).rejects.toThrow(
        new CustomException(ERROR_CODES.USER_NOT_FOUND),
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });

  describe('startRecipeCooking', () => {
    const userId = 1;
    const recipeId = 1;

    it('UserService의 startRecipeCooking 메서드를 호출해야 함', async () => {
      // Given
      mockUserService.startRecipeCooking.mockResolvedValue(true);

      // When
      const result = await service.startRecipeCooking(userId, recipeId);

      // Then
      expect(result).toBe(true);
      expect(mockUserService.startRecipeCooking).toHaveBeenCalledWith(
        userId,
        recipeId,
      );
    });
  });
});
