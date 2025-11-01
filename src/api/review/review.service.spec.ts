import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ERROR_CODES } from '@/common/constants/error-codes';
import { CustomException } from '@/common/exceptions/custom-exception';
import { CommonCode } from '@/database/entity/common-code.entity';
import { RecipeImage } from '@/database/entity/recipe-image.entity';
import { Recipe } from '@/database/entity/recipe.entity';
import { UserCompletedRecipe } from '@/database/entity/user-completed-recipe.entity';
import { UserRecipeReview } from '@/database/entity/user-recipe-review.entity';
import { User } from '@/database/entity/user.entity';
import { CreateUserRecipeReviewDto } from './dto/create-user-recipe-review.dto';
import { UserRecipeReviewService } from './review.service';

describe('UserRecipeReviewService', () => {
  let service: UserRecipeReviewService;

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockRecipeRepository = {
    findOne: jest.fn(),
  };

  const mockUserCompletedRecipeRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  const mockUserRecipeReviewRepository = {
    create: jest.fn(),
    save: jest.fn(),
    exists: jest.fn(),
  };

  const mockRecipeImageRepository = {
    findOne: jest.fn(),
  };

  const mockCommonCodeRepository = {
    find: jest.fn(),
  };

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    nickname: '테스트유저',
    recipeCompleteCount: 0,
    isFirstEntry: false,
    level: 1,
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockCompletedRecipe: UserCompletedRecipe = {
    id: 100,
    userId: 1,
    recipeId: 10,
    isCompleted: true,
    isReviewed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as UserCompletedRecipe;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRecipeReviewService,
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
          provide: getRepositoryToken(UserRecipeReview),
          useValue: mockUserRecipeReviewRepository,
        },
        {
          provide: getRepositoryToken(RecipeImage),
          useValue: mockRecipeImageRepository,
        },
        {
          provide: getRepositoryToken(CommonCode),
          useValue: mockCommonCodeRepository,
        },
      ],
    }).compile();

    service = module.get<UserRecipeReviewService>(UserRecipeReviewService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    const userId = 1;
    const completedRecipeId = 100;

    it('후기를 성공적으로 작성해야 한다', async () => {
      const createDto: CreateUserRecipeReviewDto = {
        completedRecipeId,
        tasteCode: 'R03001',
        difficultyCode: 'R04001',
        experienceCode: 'R05001',
        content: '맛있게 잘 됐어요!',
      };

      const mockReview = {
        id: 1,
        userId,
        userCompletedRecipeId: completedRecipeId,
        tasteCode: createDto.tasteCode,
        difficultyCode: createDto.difficultyCode,
        experienceCode: createDto.experienceCode,
        content: createDto.content,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserRecipeReview;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserCompletedRecipeRepository.findOne.mockResolvedValue(
        mockCompletedRecipe,
      );
      mockUserRecipeReviewRepository.create.mockReturnValue(mockReview);
      mockUserRecipeReviewRepository.save.mockResolvedValue(mockReview);
      mockUserCompletedRecipeRepository.update.mockResolvedValue(undefined);

      const result = await service.createReview(userId, createDto);

      expect(result).toEqual(mockReview);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockUserCompletedRecipeRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: completedRecipeId,
          userId,
        },
      });
      expect(mockUserRecipeReviewRepository.create).toHaveBeenCalledWith({
        userId,
        userCompletedRecipeId: completedRecipeId,
        tasteCode: createDto.tasteCode,
        difficultyCode: createDto.difficultyCode,
        experienceCode: createDto.experienceCode,
        content: createDto.content,
      });
      expect(mockUserRecipeReviewRepository.save).toHaveBeenCalled();
      expect(mockUserCompletedRecipeRepository.update).toHaveBeenCalledWith(
        completedRecipeId,
        { isReviewed: true },
      );
    });

    it('같은 completedRecipeId로 여러 번 후기를 작성할 수 있어야 한다', async () => {
      const createDto1: CreateUserRecipeReviewDto = {
        completedRecipeId,
        tasteCode: 'R03001',
        difficultyCode: 'R04001',
        experienceCode: 'R05001',
        content: '첫 번째 후기입니다!',
      };

      const createDto2: CreateUserRecipeReviewDto = {
        completedRecipeId,
        tasteCode: 'R03002',
        difficultyCode: 'R04002',
        experienceCode: 'R05002',
        content: '두 번째 후기입니다!',
      };

      const createDto3: CreateUserRecipeReviewDto = {
        completedRecipeId,
        tasteCode: 'R03003',
        difficultyCode: 'R04003',
        experienceCode: 'R05003',
        content: '세 번째 후기입니다!',
      };

      const mockReview1 = {
        id: 1,
        userId,
        userCompletedRecipeId: completedRecipeId,
        ...createDto1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserRecipeReview;

      const mockReview2 = {
        id: 2,
        userId,
        userCompletedRecipeId: completedRecipeId,
        ...createDto2,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserRecipeReview;

      const mockReview3 = {
        id: 3,
        userId,
        userCompletedRecipeId: completedRecipeId,
        ...createDto3,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserRecipeReview;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserCompletedRecipeRepository.findOne.mockResolvedValue(
        mockCompletedRecipe,
      );
      mockUserRecipeReviewRepository.create
        .mockReturnValueOnce(mockReview1)
        .mockReturnValueOnce(mockReview2)
        .mockReturnValueOnce(mockReview3);
      mockUserRecipeReviewRepository.save
        .mockResolvedValueOnce(mockReview1)
        .mockResolvedValueOnce(mockReview2)
        .mockResolvedValueOnce(mockReview3);
      mockUserCompletedRecipeRepository.update.mockResolvedValue(undefined);

      // 첫 번째 후기 작성
      const result1 = await service.createReview(userId, createDto1);
      expect(result1.id).toBe(1);
      expect(result1.content).toBe('첫 번째 후기입니다!');

      // 두 번째 후기 작성
      const result2 = await service.createReview(userId, createDto2);
      expect(result2.id).toBe(2);
      expect(result2.content).toBe('두 번째 후기입니다!');

      // 세 번째 후기 작성
      const result3 = await service.createReview(userId, createDto3);
      expect(result3.id).toBe(3);
      expect(result3.content).toBe('세 번째 후기입니다!');

      // 각각 다른 리뷰 ID를 가져야 함
      expect(result1.id).not.toBe(result2.id);
      expect(result2.id).not.toBe(result3.id);
      expect(result1.id).not.toBe(result3.id);

      // create가 3번 호출되었는지 확인
      expect(mockUserRecipeReviewRepository.create).toHaveBeenCalledTimes(3);
      expect(mockUserRecipeReviewRepository.save).toHaveBeenCalledTimes(3);
      expect(mockUserCompletedRecipeRepository.update).toHaveBeenCalledTimes(3);
    });

    it('존재하지 않는 사용자면 USER_NOT_FOUND 예외', async () => {
      const createDto: CreateUserRecipeReviewDto = {
        completedRecipeId,
        content: '테스트 후기',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.createReview(userId, createDto)).rejects.toThrow(
        CustomException,
      );
      await expect(service.createReview(userId, createDto)).rejects.toThrow(
        ERROR_CODES.USER_NOT_FOUND.message,
      );
    });

    it('존재하지 않거나 완료되지 않은 completedRecipeId면 REVIEW_NOT_ALLOWED 예외', async () => {
      const createDto: CreateUserRecipeReviewDto = {
        completedRecipeId,
        content: '테스트 후기',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserCompletedRecipeRepository.findOne.mockResolvedValue(null);

      await expect(service.createReview(userId, createDto)).rejects.toThrow(
        CustomException,
      );
      await expect(service.createReview(userId, createDto)).rejects.toThrow(
        ERROR_CODES.REVIEW_NOT_ALLOWED.message,
      );
    });

    it('완료되지 않은 레시피에 대한 후기는 REVIEW_NOT_ALLOWED 예외', async () => {
      const createDto: CreateUserRecipeReviewDto = {
        completedRecipeId,
        content: '테스트 후기',
      };

      const incompleteRecipe = {
        ...mockCompletedRecipe,
        isCompleted: false,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserCompletedRecipeRepository.findOne.mockResolvedValue(
        incompleteRecipe,
      );

      await expect(service.createReview(userId, createDto)).rejects.toThrow(
        CustomException,
      );
      await expect(service.createReview(userId, createDto)).rejects.toThrow(
        ERROR_CODES.REVIEW_NOT_ALLOWED.message,
      );
    });
  });
});
