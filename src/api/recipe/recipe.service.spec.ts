import { CacheService } from '@/common/cache/cache.service';
import { CustomException } from '@/common/exceptions/custom-exception';
import { Condition } from '@/database/entity/condition.entity';
import { IngredientHealthInfo } from '@/database/entity/ingredient-health-info.entity';
import { Ingredient } from '@/database/entity/ingredient.entity';
import { RecipeHealthPoint } from '@/database/entity/recipe-health-point.entity';
import { RecipeImage } from '@/database/entity/recipe-image.entity';
import { RecipeIngredient } from '@/database/entity/recipe-ingredient.entity';
import { RecipeRecommendationCondition } from '@/database/entity/recipe-recommendation-condition.entity';
import { RecipeSeasoning } from '@/database/entity/recipe-seasoning.entity';
import { RecipeStep } from '@/database/entity/recipe-step.entity';
import { RecipeTool } from '@/database/entity/recipe-tool.entity';
import { Recipe } from '@/database/entity/recipe.entity';
import { Seasoning } from '@/database/entity/seasoning.entity';
import { Tool } from '@/database/entity/tool.entity';
import { UserRecipeBookmark } from '@/database/entity/user-recipe-bookmark.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommonCodeService } from '../common-code/common-code.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { RecipeService } from './recipe.service';
import { RecipeRecommendationService } from './services/recipe-recommendation.service';

// @Transactional() 데코레이터 모킹
jest.mock('typeorm-transactional', () => ({
  Transactional:
    () =>
    (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      // 데코레이터를 우회하고 원본 메서드를 그대로 반환
      return descriptor;
    },
}));

type MockType<T> = {
  [P in keyof T]?: jest.Mock<any>;
};

const createRepositoryMock = <T>(): MockType<Repository<T>> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  softDelete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('RecipeService', () => {
  let service: RecipeService;
  let recipeRepository: MockType<Repository<Recipe>>;
  let recipeRecommendationService: jest.Mocked<RecipeRecommendationService>;
  let conditionRepository: MockType<Repository<Condition>>;
  let recipeRecommendationConditionRepository: MockType<
    Repository<RecipeRecommendationCondition>
  >;

  const cacheServiceMock: jest.Mocked<CacheService> = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  } as any;

  const commonCodeServiceMock: jest.Mocked<CommonCodeService> = {
    getCommonCodeByCode: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeService,
        {
          provide: getRepositoryToken(Recipe),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(RecipeImage),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(RecipeIngredient),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(RecipeSeasoning),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(RecipeTool),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(RecipeStep),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(RecipeHealthPoint),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(IngredientHealthInfo),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(Ingredient),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(Seasoning),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(Tool),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(RecipeRecommendationCondition),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(UserRecipeBookmark),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(Condition),
          useFactory: createRepositoryMock,
        },
        { provide: CacheService, useValue: cacheServiceMock },
        { provide: CommonCodeService, useValue: commonCodeServiceMock },
        {
          provide: RecipeRecommendationService,
          useValue: {
            invalidateCacheByRecipeId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecipeService>(RecipeService);
    recipeRepository = module.get(getRepositoryToken(Recipe));
    recipeRecommendationService = module.get(RecipeRecommendationService);
    conditionRepository = module.get(getRepositoryToken(Condition));
    recipeRecommendationConditionRepository = module.get(
      getRepositoryToken(RecipeRecommendationCondition),
    );

    jest.clearAllMocks();
  });

  describe('createRecipe', () => {
    const createRecipeDto: CreateRecipeDto = {
      title: '테스트 레시피',
      description: '테스트 설명',
      duration: 30,
      conditionId: 1,
      ingredients: [],
      steps: [],
    };

    it('레시피 생성 성공 시 캐시 무효화를 호출해야 함', async () => {
      const savedRecipe = {
        id: 123,
        title: createRecipeDto.title,
        description: createRecipeDto.description,
        duration: createRecipeDto.duration,
      } as Recipe;

      const createdRecipe = {
        ...savedRecipe,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Recipe;

      const conditions = [
        { id: 1, name: '조건1' },
        { id: 2, name: '조건2' },
      ] as Condition[];

      recipeRepository.create.mockReturnValue(savedRecipe as any);
      recipeRepository.save.mockResolvedValue(savedRecipe as any);
      recipeRepository.findOne.mockResolvedValue(createdRecipe);
      conditionRepository.find.mockResolvedValue(conditions);
      recipeRecommendationConditionRepository.save.mockResolvedValue([]);

      const result = await service.createRecipe(createRecipeDto);

      expect(result).toEqual(createdRecipe);
      expect(
        recipeRecommendationService.invalidateCacheByRecipeId,
      ).toHaveBeenCalledWith(123);
      expect(
        recipeRecommendationService.invalidateCacheByRecipeId,
      ).toHaveBeenCalledTimes(1);
    });

    it('레시피 생성 실패 시 캐시 무효화를 호출하지 않아야 함', async () => {
      recipeRepository.create.mockReturnValue({} as any);
      recipeRepository.save.mockRejectedValue(new Error('DB 에러'));

      await expect(service.createRecipe(createRecipeDto)).rejects.toThrow(
        CustomException,
      );

      expect(
        recipeRecommendationService.invalidateCacheByRecipeId,
      ).not.toHaveBeenCalled();
    });
  });

  describe('deleteRecipe', () => {
    const recipeId = 123;

    it('레시피 삭제 성공 시 캐시 무효화를 호출해야 함', async () => {
      const recipe = {
        id: recipeId,
        title: '테스트 레시피',
        description: '테스트 설명',
        duration: 30,
      } as Recipe;

      recipeRepository.findOne.mockResolvedValue(recipe);
      recipeRepository.softDelete.mockResolvedValue({ affected: 1 } as any);

      await service.deleteRecipe(recipeId);

      expect(recipeRepository.softDelete).toHaveBeenCalledWith(recipeId);
      expect(
        recipeRecommendationService.invalidateCacheByRecipeId,
      ).toHaveBeenCalledWith(recipeId);
      expect(
        recipeRecommendationService.invalidateCacheByRecipeId,
      ).toHaveBeenCalledTimes(1);
    });

    it('레시피가 없으면 에러를 발생시키고 캐시 무효화를 호출하지 않아야 함', async () => {
      recipeRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteRecipe(recipeId)).rejects.toThrow(
        CustomException,
      );

      expect(recipeRepository.softDelete).not.toHaveBeenCalled();
      expect(
        recipeRecommendationService.invalidateCacheByRecipeId,
      ).not.toHaveBeenCalled();
    });

    it('레시피 삭제 실패 시 캐시 무효화를 호출하지 않아야 함', async () => {
      const recipe = {
        id: recipeId,
        title: '테스트 레시피',
      } as Recipe;

      recipeRepository.findOne.mockResolvedValue(recipe);
      recipeRepository.softDelete.mockRejectedValue(new Error('DB 에러'));

      await expect(service.deleteRecipe(recipeId)).rejects.toThrow(
        CustomException,
      );

      expect(
        recipeRecommendationService.invalidateCacheByRecipeId,
      ).not.toHaveBeenCalled();
    });
  });
});
