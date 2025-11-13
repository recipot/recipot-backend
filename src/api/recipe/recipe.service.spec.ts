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
import { FileCleanupService } from '../file-cleanup/file-cleanup.service';
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
  let recipeImageRepository: MockType<Repository<RecipeImage>>;
  let recipeIngredientRepository: MockType<Repository<RecipeIngredient>>;
  let recipeSeasoningRepository: MockType<Repository<RecipeSeasoning>>;
  let recipeToolRepository: MockType<Repository<RecipeTool>>;
  let recipeStepRepository: MockType<Repository<RecipeStep>>;
  let ingredientRepository: MockType<Repository<Ingredient>>;
  let seasoningRepository: MockType<Repository<Seasoning>>;
  let toolRepository: MockType<Repository<Tool>>;
  let ingredientHealthInfoRepository: MockType<
    Repository<IngredientHealthInfo>
  >;
  let userRecipeBookmarkRepository: MockType<Repository<UserRecipeBookmark>>;
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
        {
          provide: FileCleanupService,
          useValue: {
            deleteS3FilesByKeys: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecipeService>(RecipeService);
    recipeRepository = module.get(getRepositoryToken(Recipe));
    recipeImageRepository = module.get(getRepositoryToken(RecipeImage));
    recipeIngredientRepository = module.get(
      getRepositoryToken(RecipeIngredient),
    );
    recipeSeasoningRepository = module.get(getRepositoryToken(RecipeSeasoning));
    recipeToolRepository = module.get(getRepositoryToken(RecipeTool));
    recipeStepRepository = module.get(getRepositoryToken(RecipeStep));
    ingredientRepository = module.get(getRepositoryToken(Ingredient));
    seasoningRepository = module.get(getRepositoryToken(Seasoning));
    toolRepository = module.get(getRepositoryToken(Tool));
    ingredientHealthInfoRepository = module.get(
      getRepositoryToken(IngredientHealthInfo),
    );
    userRecipeBookmarkRepository = module.get(
      getRepositoryToken(UserRecipeBookmark),
    );
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

  describe('getRecipe', () => {
    const recipeId = 1;
    const userId = 1;

    const mockRecipe: Recipe = {
      id: recipeId,
      title: '테스트 레시피',
      description: '테스트 설명',
      duration: '30분',
    } as unknown as Recipe;

    const mockImages: RecipeImage[] = [
      {
        id: 1,
        recipeId,
        imageUrl: 'https://example.com/image1.jpg',
      } as RecipeImage,
    ];

    const mockRecipeIngredients: RecipeIngredient[] = [
      {
        id: 1,
        recipeId,
        ingredientId: 1,
        amount: '1마리',
        isAlternative: false,
      } as RecipeIngredient,
      {
        id: 2,
        recipeId,
        ingredientId: 2,
        amount: '2큰술',
        isAlternative: true,
      } as RecipeIngredient,
    ];

    const mockRecipeSeasonings: RecipeSeasoning[] = [
      {
        id: 1,
        recipeId,
        seasoningId: 1,
        amount: '1큰술',
      } as RecipeSeasoning,
    ];

    const mockRecipeTools: RecipeTool[] = [
      {
        id: 1,
        recipeId,
        toolId: 1,
      } as RecipeTool,
    ];

    const mockSteps: RecipeStep[] = [
      {
        id: 1,
        recipeId,
        orderNum: 1,
        summary: '요약',
        content: '내용',
        imageUrl: 'https://example.com/step1.jpg',
      } as RecipeStep,
    ];

    const mockIngredients: Ingredient[] = [
      { id: 1, name: '고등어' } as Ingredient,
      { id: 2, name: '양파' } as Ingredient,
    ];

    const mockSeasonings: Seasoning[] = [{ id: 1, name: '간장' } as Seasoning];

    const mockTools: Tool[] = [
      {
        id: 1,
        name: '팬',
        imageUrl: 'https://example.com/pan.jpg',
      } as Tool,
    ];

    const mockHealthInfo: IngredientHealthInfo[] = [
      {
        id: 1,
        ingredientId: 1,
        content: '고등어는 오메가3가 풍부합니다.',
      } as IngredientHealthInfo,
    ];

    beforeEach(() => {
      recipeRepository.findOne.mockResolvedValue(mockRecipe);
      recipeImageRepository.find.mockResolvedValue(mockImages);
      recipeIngredientRepository.find.mockResolvedValue(mockRecipeIngredients);
      recipeSeasoningRepository.find.mockResolvedValue(mockRecipeSeasonings);
      recipeToolRepository.find.mockResolvedValue(mockRecipeTools);
      recipeStepRepository.find.mockResolvedValue(mockSteps);
      ingredientRepository.find.mockResolvedValue(mockIngredients);
      seasoningRepository.find.mockResolvedValue(mockSeasonings);
      toolRepository.find.mockResolvedValue(mockTools);
      ingredientHealthInfoRepository.find.mockResolvedValue(mockHealthInfo);
      cacheServiceMock.get.mockResolvedValue(null);
    });

    it('userId가 undefined일 때 (공개 API) 북마크는 항상 false', async () => {
      const result = await service.getRecipe(undefined, recipeId);

      expect(result.isBookmarked).toBe(false);
      expect(userRecipeBookmarkRepository.findOne).not.toHaveBeenCalled();
      expect(cacheServiceMock.get).not.toHaveBeenCalled();
    });

    it('userId가 undefined일 때 getUserOwnedIngredients를 호출하지 않음', async () => {
      const result = await service.getRecipe(undefined, recipeId);

      expect(result.ingredients.owned).toEqual([]);
      expect(result.ingredients.notOwned.length).toBeGreaterThan(0);
      expect(cacheServiceMock.get).not.toHaveBeenCalled();
    });

    it('userId가 있을 때 북마크 조회를 수행함', async () => {
      const mockBookmark = {
        id: 1,
        userId,
        recipeId,
      } as UserRecipeBookmark;

      userRecipeBookmarkRepository.findOne.mockResolvedValue(mockBookmark);
      cacheServiceMock.get.mockResolvedValue(JSON.stringify([1]));

      const result = await service.getRecipe(userId, recipeId);

      expect(userRecipeBookmarkRepository.findOne).toHaveBeenCalledWith({
        where: { userId, recipeId },
      });
      expect(result.isBookmarked).toBe(true);
    });

    it('userId가 있을 때 북마크가 없으면 false 반환', async () => {
      userRecipeBookmarkRepository.findOne.mockResolvedValue(null);
      cacheServiceMock.get.mockResolvedValue(JSON.stringify([1]));

      const result = await service.getRecipe(userId, recipeId);

      expect(result.isBookmarked).toBe(false);
    });

    it('userId가 있을 때 사용자 보유 재료를 조회함', async () => {
      const ownedIngredientIds = [1];
      userRecipeBookmarkRepository.findOne.mockResolvedValue(null);
      cacheServiceMock.get.mockResolvedValue(
        JSON.stringify(ownedIngredientIds),
      );

      const result = await service.getRecipe(userId, recipeId);

      expect(cacheServiceMock.get).toHaveBeenCalledWith(
        `user:${userId}:owned_ingredients`,
      );
      expect(result.ingredients.owned.length).toBeGreaterThan(0);
    });

    it('레시피가 없으면 RECIPE_NOT_FOUND 에러 발생', async () => {
      recipeRepository.findOne.mockResolvedValue(null);

      await expect(service.getRecipe(undefined, recipeId)).rejects.toThrow(
        CustomException,
      );
    });

    it('정상적으로 레시피 정보를 반환함', async () => {
      userRecipeBookmarkRepository.findOne.mockResolvedValue(null);
      cacheServiceMock.get.mockResolvedValue(null);

      const result = await service.getRecipe(undefined, recipeId);

      expect(result.id).toBe(recipeId);
      expect(result.title).toBe(mockRecipe.title);
      expect(result.description).toBe(mockRecipe.description);
      expect(result.duration).toBe(mockRecipe.duration);
      expect(result.images).toHaveLength(1);
      expect(result.images[0].id).toBe(mockImages[0].id);
      expect(result.images[0].imageUrl).toBe(mockImages[0].imageUrl);
      expect(result.seasonings).toHaveLength(1);
      expect(result.tools).toHaveLength(1);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0]).toHaveProperty('orderNum');
      expect(result.steps[0]).toHaveProperty('summary');
      expect(result.steps[0]).toHaveProperty('content');
      expect(result.steps[0]).toHaveProperty('imageUrl');
      expect(result.healthPoint).toHaveProperty('content');
      expect(result.isBookmarked).toBe(false);
    });

    it('재료가 보유/미보유로 올바르게 분류됨', async () => {
      const ownedIngredientIds = [1];
      userRecipeBookmarkRepository.findOne.mockResolvedValue(null);
      cacheServiceMock.get.mockResolvedValue(
        JSON.stringify(ownedIngredientIds),
      );

      const result = await service.getRecipe(userId, recipeId);

      // ingredientId 1은 owned에 있어야 함
      expect(result.ingredients.owned.some((ing) => ing.id === 1)).toBeTruthy();
      // ingredientId 2는 notOwned에 있어야 함
      expect(
        result.ingredients.notOwned.some((ing) => ing.id === 2),
      ).toBeTruthy();
    });

    it('대체 불가능한 재료는 alternativeUnavailable에 포함됨', async () => {
      userRecipeBookmarkRepository.findOne.mockResolvedValue(null);
      cacheServiceMock.get.mockResolvedValue(null);

      const result = await service.getRecipe(undefined, recipeId);

      // isAlternative가 false인 재료는 alternativeUnavailable에 포함
      expect(
        result.ingredients.alternativeUnavailable.some(
          (ing) => ing.id === 1 && !ing.isAlternative,
        ),
      ).toBeTruthy();
    });
  });
});
