import { CacheService } from '@/common/cache/cache.service';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { CustomException } from '@/common/exceptions/custom-exception';
import { LoggerFactoryService } from '@/common/logger/logger-factory.service';
import { CommonCode } from '@/database/entity/common-code.entity';
import { Recipe } from '@/database/entity/recipe.entity';
import { UserCompletedRecipe } from '@/database/entity/user-completed-recipe.entity';
import { UserRecipeBookmark } from '@/database/entity/user-recipe-bookmark.entity';
import { User } from '@/database/entity/user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateRecipeCompletionRequestDto } from './dto/create-recipe-completion.dto';
import { UserRole } from './enums/role.enum';
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
    const createRecipeCompletionDto: CreateRecipeCompletionRequestDto = {
      userId,
      recipeId,
    };

    const mockUser: User = {
      id: userId,
      email: 'test@example.com',
      nickname: '테스트유저',
      recipeCompleteCount: 0,
      isFirstEntry: false,
      role: UserRole.GENERAL,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as User;

    const mockRecipe: Recipe = {
      id: recipeId,
      title: '테스트 레시피',
      description: '테스트 설명',
      duration: '30분',
      level: '초급',
      method: '볶음',
      conditionId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as Recipe;

    it('레시피를 성공적으로 완료해야 한다', async () => {
      // Given
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockUserCompletedRecipeRepository.findOne.mockResolvedValue(null);
      mockUserCompletedRecipeRepository.create.mockReturnValue({
        userId,
        recipeId,
        isCompleted: true,
        isReviewed: false,
      });
      mockUserCompletedRecipeRepository.save.mockResolvedValue({});
      mockUserRepository.save.mockResolvedValue(mockUser);

      // When
      const result = await service.completeRecipe(
        userId,
        createRecipeCompletionDto,
      );

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
        isCompleted: true,
        isReviewed: false,
      });
      expect(mockUserCompletedRecipeRepository.save).toHaveBeenCalled();
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
        deletedAt: null,
      } as UserCompletedRecipe;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRecipeRepository.findOne.mockResolvedValue(mockRecipe);
      mockUserCompletedRecipeRepository.findOne.mockResolvedValue(
        existingCompletion,
      );

      // When
      const result = await service.completeRecipe(
        userId,
        createRecipeCompletionDto,
      );

      // Then
      expect(result).toBe(true);
      expect(mockUserCompletedRecipeRepository.save).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('존재하지 않는 사용자로 완료할 경우 USER_NOT_FOUND 예외를 발생시켜야 한다', async () => {
      // Given
      mockUserRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(
        service.completeRecipe(userId, createRecipeCompletionDto),
      ).rejects.toThrow(CustomException);
      await expect(
        service.completeRecipe(userId, createRecipeCompletionDto),
      ).rejects.toThrow(ERROR_CODES.USER_NOT_FOUND.message);
    });

    it('존재하지 않는 레시피로 완료할 경우 RECIPE_NOT_FOUND 예외를 발생시켜야 한다', async () => {
      // Given
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRecipeRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(
        service.completeRecipe(userId, createRecipeCompletionDto),
      ).rejects.toThrow(CustomException);
      await expect(
        service.completeRecipe(userId, createRecipeCompletionDto),
      ).rejects.toThrow(ERROR_CODES.RECIPE_NOT_FOUND.message);
    });
  });
});
