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
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SocialLoginService } from '../social-login/social-login.service';
import { UserRole } from './enums/role.enum';
import { UserRecentRecipesCustomRepository } from './user-recent-recipes.custom-repository';
import { UserRecipeBookmarkCustomRepository } from './user-recipe-bookmark.custom-repository';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockRecipeRepository = {
    findOne: jest.fn(),
  };

  const mockUserCompletedRecipeRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRecipeBookmarkRepository = {
    delete: jest.fn(),
  };

  const mockUserRecentRecipesRepository = {
    findOne: jest.fn(),
    remove: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockSocialLoginService = {
    findByUserId: jest.fn(),
  };

  // 공통으로 사용할 Mock 데이터
  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    nickname: '테스트유저',
    recipeCompleteCount: 0,
    isFirstEntry: false,
    role: UserRole.GENERAL,
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockRecipe: Recipe = {
    id: 10,
    title: '테스트 레시피',
    description: '테스트 설명',
    duration: '30분',
    level: '초급',
    method: '볶음',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Recipe;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Recipe),
          useValue: mockRecipeRepository,
        },
        {
          provide: getRepositoryToken(UserCompletedRecipe),
          useValue: mockUserCompletedRecipeRepository,
        },
        {
          provide: getRepositoryToken(UserRecipeBookmark),
          useValue: mockUserRecipeBookmarkRepository,
        },
        {
          provide: getRepositoryToken(UserRecentRecipes),
          useValue: mockUserRecentRecipesRepository,
        },
        {
          provide: getRepositoryToken(CommonCode),
          useValue: {
            findOne: jest.fn(),
          },
        },
        // 다른 의존성들도 모킹 (실제 서비스에서 사용하는 것들)
        {
          provide: LoggerFactoryService,
          useValue: {
            create: jest.fn().mockReturnValue({
              log: jest.fn(),
              error: jest.fn(),
            }),
          },
        },
        {
          provide: UserRecipeBookmarkCustomRepository,
          useValue: {
            existsByUserIdAndRecipeId: jest.fn(),
            save: jest.fn(),
            findBookmarksWithRecipeByUserId: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            set: jest.fn(),
          },
        },
        {
          provide: UserRecentRecipesCustomRepository,
          useValue: {
            findRecentRecipesWithRecipeByUserIdPaginated: jest.fn(),
          },
        },
        {
          provide: SocialLoginService,
          useValue: mockSocialLoginService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('completeRecipe', () => {
    const userId = 1;
    const recipeId = 10;

    it('레시피를 성공적으로 완료해야 한다', async () => {
      // Given
      const existingCookingRecord = {
        userId,
        recipeId,
        isCompleted: false,
        isReviewed: false,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockUserCompletedRecipeRepository.findOne.mockResolvedValue(
        existingCookingRecord,
      );
      mockUserCompletedRecipeRepository.save.mockResolvedValue({});
      mockUserRepository.save.mockResolvedValue(mockUser);

      // When
      const result = await service.completeRecipe(userId, recipeId);

      // Then
      expect(result).toBe(true);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockRecipeRepository.findOne).toHaveBeenCalledWith({
        where: { id: recipeId },
      });
      expect(mockUserCompletedRecipeRepository.findOne).toHaveBeenCalledWith({
        where: { userId, recipeId },
      });
      expect(mockUserCompletedRecipeRepository.save).toHaveBeenCalledWith({
        userId,
        recipeId,
        isCompleted: true,
        isReviewed: false,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        recipeCompleteCount: 1,
      });
    });

    it('이미 완료된 레시피를 다시 완료할 경우 true를 반환해야 한다', async () => {
      // Given
      const existingCompletion: UserCompletedRecipe = {
        id: 1,
        userId,
        recipeId,
        isCompleted: true,
        isReviewed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserCompletedRecipe;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockUserCompletedRecipeRepository.findOne.mockResolvedValue(
        existingCompletion,
      );

      // When
      const result = await service.completeRecipe(userId, recipeId);

      // Then
      expect(result).toBe(true);
      expect(mockUserCompletedRecipeRepository.save).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('존재하지 않는 사용자로 완료할 경우 USER_NOT_FOUND 예외를 발생시켜야 한다', async () => {
      // Given
      mockUserRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(service.completeRecipe(userId, recipeId)).rejects.toThrow(
        CustomException,
      );
      await expect(service.completeRecipe(userId, recipeId)).rejects.toThrow(
        ERROR_CODES.USER_NOT_FOUND.message,
      );
    });

    it('존재하지 않는 레시피로 완료할 경우 RECIPE_NOT_FOUND 예외를 발생시켜야 한다', async () => {
      // Given
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRecipeRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(service.completeRecipe(userId, recipeId)).rejects.toThrow(
        CustomException,
      );
      await expect(service.completeRecipe(userId, recipeId)).rejects.toThrow(
        ERROR_CODES.RECIPE_NOT_FOUND.message,
      );
    });

    it('요리 시작 기록이 없는 레시피로 완료할 경우 RECIPE_COOKING_NOT_STARTED 예외를 발생시켜야 한다', async () => {
      // Given
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockUserCompletedRecipeRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(service.completeRecipe(userId, recipeId)).rejects.toThrow(
        CustomException,
      );
      await expect(service.completeRecipe(userId, recipeId)).rejects.toThrow(
        ERROR_CODES.RECIPE_COOKING_NOT_STARTED.message,
      );
    });
  });

  describe('startRecipeCooking', () => {
    const userId = 1;
    const recipeId = 10;

    it('레시피 요리를 성공적으로 시작해야 한다', async () => {
      // Given
      const mockCreatedEntity = {
        userId,
        recipeId,
        isCompleted: false,
        isReviewed: false,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockUserCompletedRecipeRepository.findOne.mockResolvedValue(null);
      mockUserCompletedRecipeRepository.create.mockReturnValue(
        mockCreatedEntity,
      );
      mockUserCompletedRecipeRepository.save.mockResolvedValue(
        mockCreatedEntity,
      );

      // When
      const result = await service.startRecipeCooking(userId, recipeId);

      // Then
      expect(result).toBe(true);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockRecipeRepository.findOne).toHaveBeenCalledWith({
        where: { id: recipeId },
      });
      expect(mockUserCompletedRecipeRepository.findOne).toHaveBeenCalledWith({
        where: { userId, recipeId },
      });
      expect(mockUserCompletedRecipeRepository.create).toHaveBeenCalledWith({
        userId,
        recipeId,
        isCompleted: false,
        isReviewed: false,
      });
      expect(mockUserCompletedRecipeRepository.save).toHaveBeenCalledWith(
        mockCreatedEntity,
      );
    });

    it('이미 요리를 시작한 레시피를 다시 시작할 경우 true를 반환해야 한다', async () => {
      // Given
      const existingCookingRecord: UserCompletedRecipe = {
        id: 1,
        userId,
        recipeId,
        isCompleted: false,
        isReviewed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserCompletedRecipe;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockUserCompletedRecipeRepository.findOne.mockResolvedValue(
        existingCookingRecord,
      );

      // When
      const result = await service.startRecipeCooking(userId, recipeId);

      // Then
      expect(result).toBe(true);
      expect(mockUserCompletedRecipeRepository.create).not.toHaveBeenCalled();
      expect(mockUserCompletedRecipeRepository.save).not.toHaveBeenCalled();
    });

    it('존재하지 않는 사용자로 요리 시작할 경우 USER_NOT_FOUND 예외를 발생시켜야 한다', async () => {
      // Given
      mockUserRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(
        service.startRecipeCooking(userId, recipeId),
      ).rejects.toThrow(CustomException);
      await expect(
        service.startRecipeCooking(userId, recipeId),
      ).rejects.toThrow(ERROR_CODES.USER_NOT_FOUND.message);
    });

    it('존재하지 않는 레시피로 요리 시작할 경우 RECIPE_NOT_FOUND 예외를 발생시켜야 한다', async () => {
      // Given
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRecipeRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(
        service.startRecipeCooking(userId, recipeId),
      ).rejects.toThrow(CustomException);
      await expect(
        service.startRecipeCooking(userId, recipeId),
      ).rejects.toThrow(ERROR_CODES.RECIPE_NOT_FOUND.message);
    });
  });
});
