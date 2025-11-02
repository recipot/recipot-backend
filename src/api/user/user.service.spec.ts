import { CacheService } from '@/common/cache/cache.service';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { CustomException } from '@/common/exceptions/custom-exception';
import { LoggerFactoryService } from '@/common/logger/logger-factory.service';
import { CommonCode } from '@/database/entity/common-code.entity';
import { Ingredient } from '@/database/entity/ingredient.entity';
import { Recipe } from '@/database/entity/recipe.entity';
import { UserCompletedRecipe } from '@/database/entity/user-completed-recipe.entity';
import { UserDailyConditions } from '@/database/entity/user-daily-conditions.entity';
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
    query: jest.fn(),
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

  // NEW: minimal Ingredient repository mock to satisfy DI
  const mockIngredientRepository = {
    createQueryBuilder: jest.fn(() => ({
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      getCount: jest.fn().mockResolvedValue(0),
    })),
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
    level: 1,
    role: UserRole.GENERAL,
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockRecipe: Recipe = {
    id: 10,
    title: '테스트 레시피',
    description: '테스트 설명',
    duration: 30,
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
          provide: getRepositoryToken(UserDailyConditions),
          useValue: {},
        },
        {
          provide: getRepositoryToken(CommonCode),
          useValue: { findOne: jest.fn() },
        },
        // NEW: provide Ingredient repository for DI
        {
          provide: getRepositoryToken(Ingredient),
          useValue: mockIngredientRepository,
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
          useValue: { set: jest.fn() },
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
    const completedRecipeId = 100;

    it('레시피를 성공적으로 완료해야 한다', async () => {
      const existingCookingRecord: UserCompletedRecipe = {
        id: completedRecipeId,
        userId,
        recipeId: 10,
        isCompleted: false,
        isReviewed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserCompletedRecipe;

      const updatedUser = {
        ...mockUser,
        recipeCompleteCount: 1,
        level: 1,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserCompletedRecipeRepository.findOne.mockResolvedValue(
        existingCookingRecord,
      );
      mockUserCompletedRecipeRepository.save.mockResolvedValue({
        ...existingCookingRecord,
        isCompleted: true,
      });
      mockUserRepository.save.mockResolvedValue(updatedUser);

      // logCompletionHistory를 위한 mock
      jest
        .spyOn(service as any, 'logCompletionHistory')
        .mockResolvedValue(undefined);

      const result = await service.completeRecipe(userId, completedRecipeId);

      expect(result).toBe(true);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockUserCompletedRecipeRepository.findOne).toHaveBeenCalledWith({
        where: { id: completedRecipeId, userId },
      });
      expect(mockUserCompletedRecipeRepository.save).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('이미 완료된 레시피를 다시 완료할 경우에도 완료 처리를 수행해야 한다', async () => {
      const existingCompletion: UserCompletedRecipe = {
        id: completedRecipeId,
        userId,
        recipeId: 10,
        isCompleted: true,
        isReviewed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserCompletedRecipe;

      const updatedUser = {
        ...mockUser,
        recipeCompleteCount: 1,
        level: 1,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserCompletedRecipeRepository.findOne.mockResolvedValue(
        existingCompletion,
      );
      mockUserCompletedRecipeRepository.save.mockResolvedValue(
        existingCompletion,
      );
      mockUserRepository.save.mockResolvedValue(updatedUser);

      jest
        .spyOn(service as any, 'logCompletionHistory')
        .mockResolvedValue(undefined);

      const result = await service.completeRecipe(userId, completedRecipeId);

      expect(result).toBe(true);
      expect(mockUserCompletedRecipeRepository.save).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('존재하지 않는 사용자로 완료할 경우 USER_NOT_FOUND 예외', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.completeRecipe(userId, completedRecipeId),
      ).rejects.toThrow(CustomException);
      await expect(
        service.completeRecipe(userId, completedRecipeId),
      ).rejects.toThrow(ERROR_CODES.USER_NOT_FOUND.message);
    });

    it('요리 시작 기록이 없으면 RECIPE_COOKING_NOT_STARTED 예외', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserCompletedRecipeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.completeRecipe(userId, completedRecipeId),
      ).rejects.toThrow(CustomException);
      await expect(
        service.completeRecipe(userId, completedRecipeId),
      ).rejects.toThrow(ERROR_CODES.RECIPE_COOKING_NOT_STARTED.message);
    });

    it('다른 사용자의 completedRecipeId로 완료하려고 하면 RECIPE_COOKING_NOT_STARTED 예외', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      // userId가 다르기 때문에 findOne이 null을 반환해야 함 (다른 사용자의 레코드)
      mockUserCompletedRecipeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.completeRecipe(userId, completedRecipeId),
      ).rejects.toThrow(CustomException);
      await expect(
        service.completeRecipe(userId, completedRecipeId),
      ).rejects.toThrow(ERROR_CODES.RECIPE_COOKING_NOT_STARTED.message);
    });
  });

  describe('startRecipeCooking', () => {
    const userId = 1;
    const recipeId = 10;

    it('레시피 요리를 성공적으로 시작해야 한다', async () => {
      const mockCreatedEntity = {
        id: 123,
        userId,
        recipeId,
        isCompleted: false,
        isReviewed: false,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockUserCompletedRecipeRepository.create.mockReturnValue(
        mockCreatedEntity,
      );
      mockUserCompletedRecipeRepository.save.mockResolvedValue(
        mockCreatedEntity,
      );

      const result = await service.startRecipeCooking(userId, recipeId);

      expect(result).toEqual({ completedRecipeId: 123 });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockRecipeRepository.findOne).toHaveBeenCalledWith({
        where: { id: recipeId },
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

    it('새로운 요리 시작 기록을 생성하고 completedRecipeId를 반환해야 한다', async () => {
      const mockCreatedEntity = {
        id: 456,
        userId,
        recipeId,
        isCompleted: false,
        isReviewed: false,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockUserCompletedRecipeRepository.create.mockReturnValue(
        mockCreatedEntity,
      );
      mockUserCompletedRecipeRepository.save.mockResolvedValue(
        mockCreatedEntity,
      );

      const result = await service.startRecipeCooking(userId, recipeId);

      expect(result).toEqual({ completedRecipeId: 456 });
      expect(mockUserCompletedRecipeRepository.create).toHaveBeenCalled();
      expect(mockUserCompletedRecipeRepository.save).toHaveBeenCalled();
    });

    it('존재하지 않는 사용자면 USER_NOT_FOUND', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.startRecipeCooking(userId, recipeId),
      ).rejects.toThrow(CustomException);
      await expect(
        service.startRecipeCooking(userId, recipeId),
      ).rejects.toThrow(ERROR_CODES.USER_NOT_FOUND.message);
    });

    it('존재하지 않는 레시피면 RECIPE_NOT_FOUND', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRecipeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.startRecipeCooking(userId, recipeId),
      ).rejects.toThrow(CustomException);
      await expect(
        service.startRecipeCooking(userId, recipeId),
      ).rejects.toThrow(ERROR_CODES.RECIPE_NOT_FOUND.message);
    });

    it('같은 레시피를 여러 번 요리 시작할 수 있어야 한다', async () => {
      // 첫 번째 요리 시작
      const firstEntity = {
        id: 101,
        userId,
        recipeId,
        isCompleted: false,
        isReviewed: false,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockUserCompletedRecipeRepository.create
        .mockReturnValueOnce(firstEntity)
        .mockReturnValueOnce({
          id: 102,
          userId,
          recipeId,
          isCompleted: false,
          isReviewed: false,
        })
        .mockReturnValueOnce({
          id: 103,
          userId,
          recipeId,
          isCompleted: false,
          isReviewed: false,
        });
      mockUserCompletedRecipeRepository.save
        .mockResolvedValueOnce(firstEntity)
        .mockResolvedValueOnce({
          id: 102,
          userId,
          recipeId,
          isCompleted: false,
          isReviewed: false,
        })
        .mockResolvedValueOnce({
          id: 103,
          userId,
          recipeId,
          isCompleted: false,
          isReviewed: false,
        });

      // 첫 번째 요리 시작
      const firstResult = await service.startRecipeCooking(userId, recipeId);
      expect(firstResult).toEqual({ completedRecipeId: 101 });

      // 두 번째 요리 시작
      const secondResult = await service.startRecipeCooking(userId, recipeId);
      expect(secondResult).toEqual({ completedRecipeId: 102 });

      // 세 번째 요리 시작
      const thirdResult = await service.startRecipeCooking(userId, recipeId);
      expect(thirdResult).toEqual({ completedRecipeId: 103 });

      // 각각 다른 completedRecipeId를 반환해야 함
      expect(firstResult.completedRecipeId).not.toBe(
        secondResult.completedRecipeId,
      );
      expect(secondResult.completedRecipeId).not.toBe(
        thirdResult.completedRecipeId,
      );
      expect(firstResult.completedRecipeId).not.toBe(
        thirdResult.completedRecipeId,
      );

      // create가 3번 호출되었는지 확인
      expect(mockUserCompletedRecipeRepository.create).toHaveBeenCalledTimes(3);
      expect(mockUserCompletedRecipeRepository.save).toHaveBeenCalledTimes(3);
    });
  });
});
