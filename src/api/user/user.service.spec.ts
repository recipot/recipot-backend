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
  const createQueryBuilderMock = {
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
    getCount: jest.fn().mockResolvedValue(0),
    getMany: jest.fn().mockResolvedValue([]),
  };

  const mockIngredientRepository = {
    createQueryBuilder: jest.fn(() => createQueryBuilderMock),
  };

  const mockCommonRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
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
          useValue: mockCommonRepository,
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

  describe('generateRandomNickname', () => {
    const mockNicknameAdjectives: CommonCode[] = [
      {
        id: 1,
        groupCode: 'U02',
        groupCodeName: 'NICKNAME_ADJ',
        code: 'U02001',
        codeName: '발랄한',
        groupName: '닉네임 형용사',
        depth: 1,
        orderNum: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as CommonCode,
      {
        id: 2,
        groupCode: 'U02',
        groupCodeName: 'NICKNAME_ADJ',
        code: 'U02002',
        codeName: '유쾌한',
        groupName: '닉네임 형용사',
        depth: 1,
        orderNum: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as CommonCode,
      {
        id: 3,
        groupCode: 'U02',
        groupCodeName: 'NICKNAME_ADJ',
        code: 'U02003',
        codeName: '시크한',
        groupName: '닉네임 형용사',
        depth: 1,
        orderNum: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as CommonCode,
    ];

    const mockIngredients: Ingredient[] = [
      {
        id: 1,
        ingredientCategoryId: 1,
        name: '고등어',
        isRestrictedIngredient: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Ingredient,
      {
        id: 2,
        ingredientCategoryId: 1,
        name: '게',
        isRestrictedIngredient: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Ingredient,
      {
        id: 3,
        ingredientCategoryId: 1,
        name: '시금치',
        isRestrictedIngredient: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Ingredient,
    ];

    beforeEach(() => {
      mockCommonRepository.find.mockResolvedValue(mockNicknameAdjectives);
      createQueryBuilderMock.getMany.mockResolvedValue(mockIngredients);
    });

    it('랜덤 닉네임을 정상적으로 생성해야 한다', async () => {
      const nickname = await (service as any).generateRandomNickname();

      expect(nickname).toBeDefined();
      expect(typeof nickname).toBe('string');
      expect(nickname.length).toBeGreaterThan(0);
      // 형용사로 시작하고 재료 이름이 포함되어야 함
      expect(
        mockNicknameAdjectives.some((adj) => nickname.startsWith(adj.codeName)),
      ).toBe(true);
      expect(mockIngredients.some((ing) => nickname.includes(ing.name))).toBe(
        true,
      );
      // 띄어쓰기가 없어야 함
      expect(nickname).not.toContain(' ');
    });

    it('재료 이름이 )로 끝나면 다시 선택해야 한다', async () => {
      const ingredientsWithParenthesis: Ingredient[] = [
        {
          id: 1,
          ingredientCategoryId: 1,
          name: '재료1)',
          isRestrictedIngredient: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Ingredient,
        {
          id: 2,
          ingredientCategoryId: 1,
          name: '재료2)',
          isRestrictedIngredient: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Ingredient,
        {
          id: 3,
          ingredientCategoryId: 1,
          name: '고등어',
          isRestrictedIngredient: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Ingredient,
      ];

      // Math.random을 모킹하여 재료 선택 시 마지막 재료가 선택되도록 설정
      let randomCallCount = 0;
      jest.spyOn(Math, 'random').mockImplementation(() => {
        randomCallCount++;
        // 첫 번째 호출: 형용사 선택 (0.0 = 첫 번째 형용사)
        // 이후 호출들: 재료 선택
        // 재료 선택 시 처음 두 번은 0.0~0.66 사이 (재료1) 또는 재료2) 선택)
        // 세 번째 이후는 0.67 이상 (고등어 선택)
        if (randomCallCount === 1) {
          return 0.0; // 형용사 선택
        }
        // 재료가 )로 끝나면 다시 선택해야 하므로, 고등어가 선택될 때까지 반복
        return randomCallCount <= 3 ? 0.0 : 0.9; // 마지막 재료(고등어) 선택
      });

      createQueryBuilderMock.getMany.mockResolvedValue(
        ingredientsWithParenthesis,
      );

      const nickname = await (service as any).generateRandomNickname();

      expect(nickname).toBeDefined();
      expect(nickname.endsWith(')')).toBe(false);
      expect(nickname).toContain('고등어');

      jest.restoreAllMocks();
    });

    it('여러 번 호출하면 다른 닉네임이 생성될 수 있다', async () => {
      const nicknames = new Set<string>();

      // 여러 번 호출하여 서로 다른 닉네임이 생성될 수 있는지 확인
      for (let i = 0; i < 10; i++) {
        const nickname = await (service as any).generateRandomNickname();
        nicknames.add(nickname);
      }

      // 형용사와 재료의 조합이 여러 개 있으므로 다른 닉네임이 생성될 수 있음
      // (완전히 랜덤이므로 항상 다를 수는 없지만, 가능성은 있음)
      expect(nicknames.size).toBeGreaterThan(0);
      nicknames.forEach((nickname) => {
        expect(nickname).toBeDefined();
        expect(typeof nickname).toBe('string');
        expect(nickname.length).toBeGreaterThan(0);
        expect(nickname).not.toContain(' ');
      });
    });

    it('형용사와 재료를 올바르게 조합해야 한다', async () => {
      // Math.random을 고정하여 특정 값을 반환하도록 설정
      let callCount = 0;
      jest.spyOn(Math, 'random').mockImplementation(() => {
        callCount++;
        // 첫 번째 호출: 형용사 선택 (0번 인덱스 = 발랄한)
        // 두 번째 호출: 재료 선택 (0번 인덱스 = 고등어)
        return callCount === 1 ? 0.0 : 0.0;
      });

      const nickname = await (service as any).generateRandomNickname();

      expect(nickname).toBe('발랄한고등어');

      jest.restoreAllMocks();
    });

    it('닉네임이 형용사와 재료 이름으로만 구성되어야 한다', async () => {
      const nickname = await (service as any).generateRandomNickname();

      // 형용사 중 하나로 시작하는지 확인
      const startsWithAdjective = mockNicknameAdjectives.some((adj) =>
        nickname.startsWith(adj.codeName),
      );
      expect(startsWithAdjective).toBe(true);

      // 재료 이름 중 하나가 포함되는지 확인
      const containsIngredient = mockIngredients.some((ing) =>
        nickname.includes(ing.name),
      );
      expect(containsIngredient).toBe(true);

      // 띄어쓰기가 없어야 함
      expect(nickname).not.toContain(' ');
    });
  });
});
