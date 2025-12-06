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
import { IsNull, Repository } from 'typeorm';
import { CommonCodeService } from '../common-code/common-code.service';
import { FileCleanupService } from '../file-cleanup/file-cleanup.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpsertRecipeDto } from './dto/upsert-recipe.dto';
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

  describe('getRecipeList', () => {
    const mockRecipes: Recipe[] = [
      {
        id: 1,
        title: '레시피 1',
        description: '설명 1',
        duration: 15,
        deletedAt: null,
      } as Recipe,
      {
        id: 2,
        title: '레시피 2',
        description: '설명 2',
        duration: 20,
        deletedAt: null,
      } as Recipe,
    ];

    const mockImages: RecipeImage[] = [
      {
        id: 1,
        recipeId: 1,
        imageUrl: 'https://example.com/image1.jpg',
      } as RecipeImage,
      {
        id: 2,
        recipeId: 2,
        imageUrl: 'https://example.com/image2.jpg',
      } as RecipeImage,
    ];

    const mockRecipeIngredients: RecipeIngredient[] = [
      {
        id: 1,
        recipeId: 1,
        ingredientId: 1,
        amount: '100g',
        isAlternative: false,
      } as RecipeIngredient,
      {
        id: 2,
        recipeId: 1,
        ingredientId: 2,
        amount: '2개',
        isAlternative: true,
      } as RecipeIngredient,
    ];

    const mockRecipeSeasonings: RecipeSeasoning[] = [
      {
        id: 1,
        recipeId: 1,
        seasoningId: 1,
        amount: '1큰술',
      } as RecipeSeasoning,
    ];

    const mockRecipeTools: RecipeTool[] = [
      {
        id: 1,
        recipeId: 1,
        toolId: 1,
      } as RecipeTool,
    ];

    const mockSteps: RecipeStep[] = [
      {
        id: 1,
        recipeId: 1,
        orderNum: 1,
        summary: '요약 1',
        content: '내용 1',
        imageUrl: 'https://example.com/step1.jpg',
      } as RecipeStep,
      {
        id: 2,
        recipeId: 1,
        orderNum: 2,
        summary: '요약 2',
        content: '내용 2',
        imageUrl: null,
      } as RecipeStep,
    ];

    const mockRecipeRecommendationConditions: RecipeRecommendationCondition[] =
      [
        {
          id: 1,
          recipeId: 1,
          conditionId: 1,
          priorityScore: 1.0,
        } as RecipeRecommendationCondition,
      ];

    const mockIngredients: Ingredient[] = [
      {
        id: 1,
        name: '재료1',
      } as Ingredient,
      {
        id: 2,
        name: '재료2',
      } as Ingredient,
    ];

    const mockSeasonings: Seasoning[] = [
      {
        id: 1,
        name: '양념1',
      } as Seasoning,
    ];

    const mockTools: Tool[] = [
      {
        id: 1,
        name: '도구1',
        imageUrl: 'https://example.com/tool1.jpg',
      } as Tool,
    ];

    const mockConditions: Condition[] = [
      {
        id: 1,
        name: '그럭저럭',
      } as Condition,
    ];

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('레시피 목록이 없으면 빈 배열을 반환해야 함', async () => {
      recipeRepository.find.mockResolvedValue([]);

      const result = await service.getRecipeList();

      expect(result.items).toEqual([]);
      expect(recipeRepository.find).toHaveBeenCalledWith({
        where: { deletedAt: IsNull() },
        order: { id: 'ASC' },
      });
    });

    it('레시피 목록을 정상적으로 반환해야 함', async () => {
      recipeRepository.find.mockResolvedValue(mockRecipes);
      recipeImageRepository.find.mockResolvedValue(mockImages);
      recipeIngredientRepository.find.mockResolvedValue(mockRecipeIngredients);
      recipeSeasoningRepository.find.mockResolvedValue(mockRecipeSeasonings);
      recipeToolRepository.find.mockResolvedValue(mockRecipeTools);
      recipeStepRepository.find.mockResolvedValue(mockSteps);
      recipeRecommendationConditionRepository.find.mockResolvedValue(
        mockRecipeRecommendationConditions,
      );
      ingredientRepository.find.mockResolvedValue(mockIngredients);
      seasoningRepository.find.mockResolvedValue(mockSeasonings);
      toolRepository.find.mockResolvedValue(mockTools);
      conditionRepository.find.mockResolvedValue(mockConditions);

      const result = await service.getRecipeList();

      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe(1);
      expect(result.items[0].title).toBe('레시피 1');
      expect(result.items[0].imageUrl).toBe('https://example.com/image1.jpg');
      expect(result.items[0].duration).toBe(15);
      expect(result.items[0].condition).toBe('그럭저럭');
      expect(result.items[0].description).toBe('설명 1');
      expect(result.items[0].tools).toHaveLength(1);
      expect(result.items[0].tools[0].name).toBe('도구1');
      expect(result.items[0].ingredients).toHaveLength(2);
      expect(result.items[0].ingredients[0].name).toBe('재료1');
      expect(result.items[0].ingredients[0].amount).toBe('100g');
      expect(result.items[0].ingredients[0].isAlternative).toBe(false);
      expect(result.items[0].seasonings).toHaveLength(1);
      expect(result.items[0].seasonings[0].name).toBe('양념1');
      expect(result.items[0].steps).toHaveLength(2);
      expect(result.items[0].steps[0].orderNum).toBe(1);
      expect(result.items[0].steps[0].summary).toBe('요약 1');
      expect(result.items[0].steps[0].content).toBe('내용 1');
      expect(result.items[0].steps[0].imageUrl).toBe(
        'https://example.com/step1.jpg',
      );
    });

    it('레시피가 이미지가 없으면 imageUrl이 null이어야 함', async () => {
      const recipesWithoutImages = [
        {
          id: 1,
          title: '레시피 1',
          description: '설명 1',
          duration: 15,
          deletedAt: null,
        } as Recipe,
      ];

      recipeRepository.find.mockResolvedValue(recipesWithoutImages);
      recipeImageRepository.find.mockResolvedValue([]);
      recipeIngredientRepository.find.mockResolvedValue([]);
      recipeSeasoningRepository.find.mockResolvedValue([]);
      recipeToolRepository.find.mockResolvedValue([]);
      recipeStepRepository.find.mockResolvedValue([]);
      recipeRecommendationConditionRepository.find.mockResolvedValue([]);
      ingredientRepository.find.mockResolvedValue([]);
      seasoningRepository.find.mockResolvedValue([]);
      toolRepository.find.mockResolvedValue([]);
      conditionRepository.find.mockResolvedValue([]);

      const result = await service.getRecipeList();

      expect(result.items[0].imageUrl).toBeNull();
    });

    it('레시피가 컨디션이 없으면 condition이 null이어야 함', async () => {
      const recipesWithoutCondition = [
        {
          id: 1,
          title: '레시피 1',
          description: '설명 1',
          duration: 15,
          deletedAt: null,
        } as Recipe,
      ];

      recipeRepository.find.mockResolvedValue(recipesWithoutCondition);
      recipeImageRepository.find.mockResolvedValue([]);
      recipeIngredientRepository.find.mockResolvedValue([]);
      recipeSeasoningRepository.find.mockResolvedValue([]);
      recipeToolRepository.find.mockResolvedValue([]);
      recipeStepRepository.find.mockResolvedValue([]);
      recipeRecommendationConditionRepository.find.mockResolvedValue([]);
      ingredientRepository.find.mockResolvedValue([]);
      seasoningRepository.find.mockResolvedValue([]);
      toolRepository.find.mockResolvedValue([]);
      conditionRepository.find.mockResolvedValue([]);

      const result = await service.getRecipeList();

      expect(result.items[0].condition).toBeNull();
    });

    it('레시피가 ID 오름차순으로 정렬되어야 함', async () => {
      const recipes = [
        {
          id: 3,
          title: '레시피 3',
          description: '설명 3',
          duration: 25,
          deletedAt: null,
        } as Recipe,
        {
          id: 1,
          title: '레시피 1',
          description: '설명 1',
          duration: 15,
          deletedAt: null,
        } as Recipe,
        {
          id: 2,
          title: '레시피 2',
          description: '설명 2',
          duration: 20,
          deletedAt: null,
        } as Recipe,
      ];

      recipeRepository.find.mockResolvedValue(recipes);
      recipeImageRepository.find.mockResolvedValue([]);
      recipeIngredientRepository.find.mockResolvedValue([]);
      recipeSeasoningRepository.find.mockResolvedValue([]);
      recipeToolRepository.find.mockResolvedValue([]);
      recipeStepRepository.find.mockResolvedValue([]);
      recipeRecommendationConditionRepository.find.mockResolvedValue([]);
      ingredientRepository.find.mockResolvedValue([]);
      seasoningRepository.find.mockResolvedValue([]);
      toolRepository.find.mockResolvedValue([]);
      conditionRepository.find.mockResolvedValue([]);

      const result = await service.getRecipeList();

      expect(result.items[0].id).toBe(3);
      expect(result.items[1].id).toBe(1);
      expect(result.items[2].id).toBe(2);
    });
  });

  describe('upsertRecipes', () => {
    const mockCondition = {
      id: 1,
      name: '그럭저럭',
    } as Condition;

    const createUpsertDto = (id?: number): UpsertRecipeDto => ({
      id,
      title: '테스트 레시피',
      description: '테스트 설명',
      duration: 30,
      conditionId: 1,
      imageUrl: 'https://example.com/image.jpg',
      ingredients: [
        {
          id: 1,
          amount: '100g',
          isAlternative: false,
        },
      ],
      seasonings: [
        {
          id: 1,
          amount: '1큰술',
        },
      ],
      tools: [
        {
          id: 1,
        },
      ],
      steps: [
        {
          orderNum: 1,
          summary: '요약',
          content: '내용',
          imageUrl: 'https://example.com/step.jpg',
        },
      ],
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('생성과 수정이 모두 포함된 경우 올바른 카운트를 반환해야 함', async () => {
      const upsertDtos: UpsertRecipeDto[] = [
        createUpsertDto(), // 생성
        createUpsertDto(1), // 수정
        createUpsertDto(), // 생성
        createUpsertDto(2), // 수정
      ];

      const createdRecipe1 = {
        id: 10,
        title: '테스트 레시피',
        description: '테스트 설명',
        duration: 30,
      } as Recipe;

      const createdRecipe2 = {
        id: 11,
        title: '테스트 레시피',
        description: '테스트 설명',
        duration: 30,
      } as Recipe;

      const updatedRecipe1 = {
        id: 1,
        title: '테스트 레시피',
        description: '테스트 설명',
        duration: 30,
      } as Recipe;

      const updatedRecipe2 = {
        id: 2,
        title: '테스트 레시피',
        description: '테스트 설명',
        duration: 30,
      } as Recipe;

      conditionRepository.findOne.mockResolvedValue(mockCondition);
      conditionRepository.find.mockResolvedValue([mockCondition]);

      // 첫 번째 생성
      recipeRepository.create.mockReturnValueOnce(createdRecipe1 as any);
      recipeRepository.save
        .mockResolvedValueOnce(createdRecipe1 as any)
        .mockResolvedValueOnce(createdRecipe1);
      recipeRepository.findOne
        .mockResolvedValueOnce(createdRecipe1)
        .mockResolvedValueOnce(createdRecipe1);

      // 첫 번째 수정
      recipeRepository.findOne
        .mockResolvedValueOnce(updatedRecipe1)
        .mockResolvedValueOnce(updatedRecipe1);

      // 두 번째 생성
      recipeRepository.create.mockReturnValueOnce(createdRecipe2 as any);
      recipeRepository.save
        .mockResolvedValueOnce(createdRecipe2 as any)
        .mockResolvedValueOnce(createdRecipe2);
      recipeRepository.findOne
        .mockResolvedValueOnce(createdRecipe2)
        .mockResolvedValueOnce(createdRecipe2);

      // 두 번째 수정
      recipeRepository.findOne
        .mockResolvedValueOnce(updatedRecipe2)
        .mockResolvedValueOnce(updatedRecipe2);

      const result = await service.upsertRecipes(upsertDtos);

      expect(result.createdCount).toBe(2);
      expect(result.updatedCount).toBe(2);
    });

    it('모두 생성인 경우 createdCount만 반환해야 함', async () => {
      const upsertDtos: UpsertRecipeDto[] = [
        createUpsertDto(), // 생성
        createUpsertDto(), // 생성
      ];

      const createdRecipe1 = {
        id: 10,
        title: '테스트 레시피',
        description: '테스트 설명',
        duration: 30,
      } as Recipe;

      const createdRecipe2 = {
        id: 11,
        title: '테스트 레시피',
        description: '테스트 설명',
        duration: 30,
      } as Recipe;

      conditionRepository.findOne.mockResolvedValue(mockCondition);
      conditionRepository.find.mockResolvedValue([mockCondition]);

      recipeRepository.create
        .mockReturnValueOnce(createdRecipe1 as any)
        .mockReturnValueOnce(createdRecipe2 as any);
      recipeRepository.save
        .mockResolvedValueOnce(createdRecipe1 as any)
        .mockResolvedValueOnce(createdRecipe1)
        .mockResolvedValueOnce(createdRecipe2 as any)
        .mockResolvedValueOnce(createdRecipe2);
      recipeRepository.findOne
        .mockResolvedValueOnce(createdRecipe1)
        .mockResolvedValueOnce(createdRecipe1)
        .mockResolvedValueOnce(createdRecipe2)
        .mockResolvedValueOnce(createdRecipe2);

      const result = await service.upsertRecipes(upsertDtos);

      expect(result.createdCount).toBe(2);
      expect(result.updatedCount).toBe(0);
    });

    it('모두 수정인 경우 updatedCount만 반환해야 함', async () => {
      const upsertDtos: UpsertRecipeDto[] = [
        createUpsertDto(1), // 수정
        createUpsertDto(2), // 수정
      ];

      const updatedRecipe1 = {
        id: 1,
        title: '테스트 레시피',
        description: '테스트 설명',
        duration: 30,
      } as Recipe;

      const updatedRecipe2 = {
        id: 2,
        title: '테스트 레시피',
        description: '테스트 설명',
        duration: 30,
      } as Recipe;

      conditionRepository.findOne.mockResolvedValue(mockCondition);
      conditionRepository.find.mockResolvedValue([mockCondition]);

      // 첫 번째 수정
      recipeRepository.findOne
        .mockResolvedValueOnce(updatedRecipe1) // updateRecipe에서 레시피 찾기
        .mockResolvedValueOnce(updatedRecipe1); // updateRecipe에서 최종 레시피 찾기
      recipeRepository.save.mockResolvedValueOnce(updatedRecipe1);

      // 두 번째 수정
      recipeRepository.findOne
        .mockResolvedValueOnce(updatedRecipe2) // updateRecipe에서 레시피 찾기
        .mockResolvedValueOnce(updatedRecipe2); // updateRecipe에서 최종 레시피 찾기
      recipeRepository.save.mockResolvedValueOnce(updatedRecipe2);

      // updateRecipe에서 필요한 mock들
      recipeImageRepository.find.mockResolvedValue([]);
      recipeStepRepository.find.mockResolvedValue([]);
      recipeImageRepository.delete.mockResolvedValue({ affected: 0 } as any);
      recipeIngredientRepository.delete.mockResolvedValue({
        affected: 0,
      } as any);
      recipeSeasoningRepository.delete.mockResolvedValue({
        affected: 0,
      } as any);
      recipeToolRepository.delete.mockResolvedValue({ affected: 0 } as any);
      recipeStepRepository.delete.mockResolvedValue({ affected: 0 } as any);
      recipeRecommendationConditionRepository.delete.mockResolvedValue({
        affected: 0,
      } as any);

      const result = await service.upsertRecipes(upsertDtos);

      expect(result.createdCount).toBe(0);
      expect(result.updatedCount).toBe(2);
    });

    it('빈 배열인 경우 0을 반환해야 함', async () => {
      const result = await service.upsertRecipes([]);

      expect(result.createdCount).toBe(0);
      expect(result.updatedCount).toBe(0);
    });

    it('에러 발생 시 CustomException을 throw해야 함', async () => {
      const upsertDtos: UpsertRecipeDto[] = [createUpsertDto()];

      conditionRepository.findOne.mockResolvedValue(mockCondition);
      conditionRepository.find.mockResolvedValue([mockCondition]);
      recipeRepository.create.mockReturnValue({} as any);
      recipeRepository.save.mockRejectedValue(new Error('DB 에러'));

      await expect(service.upsertRecipes(upsertDtos)).rejects.toThrow(
        CustomException,
      );
    });
  });

  describe('deleteRecipes', () => {
    const recipeIds = [1, 2, 3];

    it('레시피 일괄 삭제 성공 시 캐시 무효화를 호출해야 함', async () => {
      const existingRecipes = [
        {
          id: 1,
          title: '레시피 1',
          description: '설명 1',
          duration: 30,
          deletedAt: null,
        } as Recipe,
        {
          id: 2,
          title: '레시피 2',
          description: '설명 2',
          duration: 30,
          deletedAt: null,
        } as Recipe,
        {
          id: 3,
          title: '레시피 3',
          description: '설명 3',
          duration: 30,
          deletedAt: null,
        } as Recipe,
      ];

      recipeRepository.find.mockResolvedValue(existingRecipes);
      recipeRepository.softDelete.mockResolvedValue({ affected: 3 } as any);

      const result = await service.deleteRecipes(recipeIds);

      expect(result.deletedCount).toBe(3);
      expect(result.deletedIds).toEqual([1, 2, 3]);
      expect(result.failedIds).toEqual([]);
      expect(recipeRepository.softDelete).toHaveBeenCalledWith([1, 2, 3]);
      expect(
        recipeRecommendationService.invalidateCacheByRecipeId,
      ).toHaveBeenCalledTimes(3);
      expect(
        recipeRecommendationService.invalidateCacheByRecipeId,
      ).toHaveBeenCalledWith(1);
      expect(
        recipeRecommendationService.invalidateCacheByRecipeId,
      ).toHaveBeenCalledWith(2);
      expect(
        recipeRecommendationService.invalidateCacheByRecipeId,
      ).toHaveBeenCalledWith(3);
    });

    it('존재하지 않는 레시피 ID는 failedIds에 포함되어야 함', async () => {
      const existingRecipes = [
        {
          id: 1,
          title: '레시피 1',
          description: '설명 1',
          duration: 30,
          deletedAt: null,
        } as Recipe,
      ];

      recipeRepository.find.mockResolvedValue(existingRecipes);
      recipeRepository.softDelete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.deleteRecipes([1, 2, 3, 999]);

      expect(result.deletedCount).toBe(1);
      expect(result.deletedIds).toEqual([1]);
      expect(result.failedIds).toEqual([2, 3, 999]);
      expect(recipeRepository.softDelete).toHaveBeenCalledWith([1]);
    });

    it('중복된 ID는 자동으로 제거되어야 함', async () => {
      const existingRecipes = [
        {
          id: 1,
          title: '레시피 1',
          description: '설명 1',
          duration: 30,
          deletedAt: null,
        } as Recipe,
      ];

      recipeRepository.find.mockResolvedValue(existingRecipes);
      recipeRepository.softDelete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.deleteRecipes([1, 1, 1, 2, 2]);

      expect(result.deletedCount).toBe(1);
      expect(result.deletedIds).toEqual([1]);
      expect(result.failedIds).toEqual([2]);
      expect(recipeRepository.softDelete).toHaveBeenCalledWith([1]);
    });

    it('존재하는 레시피가 없으면 빈 결과를 반환해야 함', async () => {
      recipeRepository.find.mockResolvedValue([]);

      const result = await service.deleteRecipes([999, 1000]);

      expect(result.deletedCount).toBe(0);
      expect(result.deletedIds).toEqual([]);
      expect(result.failedIds).toEqual([999, 1000]);
      expect(recipeRepository.softDelete).not.toHaveBeenCalled();
      expect(
        recipeRecommendationService.invalidateCacheByRecipeId,
      ).not.toHaveBeenCalled();
    });

    it('빈 배열이면 에러를 발생시켜야 함', async () => {
      await expect(service.deleteRecipes([])).rejects.toThrow(CustomException);

      expect(recipeRepository.softDelete).not.toHaveBeenCalled();
      expect(
        recipeRecommendationService.invalidateCacheByRecipeId,
      ).not.toHaveBeenCalled();
    });

    it('유효하지 않은 ID는 필터링되어야 함', async () => {
      const existingRecipes = [
        {
          id: 1,
          title: '레시피 1',
          description: '설명 1',
          duration: 30,
          deletedAt: null,
        } as Recipe,
      ];

      recipeRepository.find.mockResolvedValue(existingRecipes);
      recipeRepository.softDelete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.deleteRecipes([
        1,
        -1,
        0,
        1.5,
        null,
        undefined,
      ] as any);

      expect(result.deletedCount).toBe(1);
      expect(result.deletedIds).toEqual([1]);
      expect(recipeRepository.softDelete).toHaveBeenCalledWith([1]);
    });

    it('이미 삭제된 레시피는 제외되어야 함', async () => {
      const existingRecipes = [
        {
          id: 1,
          title: '레시피 1',
          description: '설명 1',
          duration: 30,
          deletedAt: null,
        } as Recipe,
      ];

      // 삭제된 레시피는 find에서 제외됨 (deletedAt: IsNull() 조건)
      recipeRepository.find.mockResolvedValue(existingRecipes);
      recipeRepository.softDelete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.deleteRecipes([1, 2]);

      expect(result.deletedCount).toBe(1);
      expect(result.deletedIds).toEqual([1]);
      expect(result.failedIds).toEqual([2]);
    });

    it('삭제 실패 시 에러를 발생시켜야 함', async () => {
      const existingRecipes = [
        {
          id: 1,
          title: '레시피 1',
          description: '설명 1',
          duration: 30,
          deletedAt: null,
        } as Recipe,
      ];

      recipeRepository.find.mockResolvedValue(existingRecipes);
      recipeRepository.softDelete.mockRejectedValue(new Error('DB 에러'));

      await expect(service.deleteRecipes([1])).rejects.toThrow(CustomException);

      expect(
        recipeRecommendationService.invalidateCacheByRecipeId,
      ).not.toHaveBeenCalled();
    });
  });
});
