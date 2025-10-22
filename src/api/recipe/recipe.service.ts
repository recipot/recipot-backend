import { CacheService } from '@/common/cache/cache.service';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { CustomException } from '@/common/exceptions/custom-exception';
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
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { CommonCodeService } from '../common-code/common-code.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import {
  GetRecipeResponseDto,
  RecipeIngredientDto,
} from './dto/get-recipe.dto';
import { UserRecipeBookmark } from '@/database/entity/user-recipe-bookmark.entity';

interface RecipeIngredientDetail {
  ingredientId: number;
  name: string;
  amount: string;
  isAlternative: boolean;
}

@Injectable()
export class RecipeService {
  private readonly logger = new Logger(RecipeService.name);

  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(RecipeImage)
    private readonly recipeImageRepository: Repository<RecipeImage>,
    @InjectRepository(RecipeIngredient)
    private readonly recipeIngredientRepository: Repository<RecipeIngredient>,
    @InjectRepository(RecipeSeasoning)
    private readonly recipeSeasoningRepository: Repository<RecipeSeasoning>,
    @InjectRepository(RecipeTool)
    private readonly recipeToolRepository: Repository<RecipeTool>,
    @InjectRepository(RecipeStep)
    private readonly recipeStepRepository: Repository<RecipeStep>,
    @InjectRepository(RecipeHealthPoint)
    private readonly recipeHealthPointRepository: Repository<RecipeHealthPoint>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(Seasoning)
    private readonly seasoningRepository: Repository<Seasoning>,
    @InjectRepository(Tool)
    private readonly toolRepository: Repository<Tool>,
    @InjectRepository(RecipeRecommendationCondition)
    private readonly recipeRecommendationConditionRepository: Repository<RecipeRecommendationCondition>,
    @InjectRepository(UserRecipeBookmark)
    private readonly userRecipeBookmarkRepository: Repository<UserRecipeBookmark>,
    private readonly cacheService: CacheService,
    private readonly commonCodeService: CommonCodeService,
  ) {}

  @Transactional()
  async createRecipe(createRecipeDto: CreateRecipeDto): Promise<Recipe> {
    try {
      const recipe = this.recipeRepository.create({
        title: createRecipeDto.title,
        description: createRecipeDto.description,
        duration: createRecipeDto.duration,
        level: createRecipeDto.level,
        method: createRecipeDto.method,
      });
      const savedRecipe = await this.recipeRepository.save(recipe);

      if (createRecipeDto.images && createRecipeDto.images.length > 0) {
        const recipeImages = createRecipeDto.images.map((imageDto) =>
          this.recipeImageRepository.create({
            recipeId: savedRecipe.id,
            imageUrl: imageDto.imageUrl,
          }),
        );
        await this.recipeImageRepository.save(recipeImages);
      }

      if (
        createRecipeDto.ingredients &&
        createRecipeDto.ingredients.length > 0
      ) {
        const recipeIngredients = createRecipeDto.ingredients.map(
          (ingredientDto) =>
            this.recipeIngredientRepository.create({
              recipeId: savedRecipe.id,
              ingredientId: ingredientDto.ingredientId,
              isAlternative: ingredientDto.isAlternative,
              amount: ingredientDto.amount,
            }),
        );
        await this.recipeIngredientRepository.save(recipeIngredients);
      }

      if (createRecipeDto.seasonings && createRecipeDto.seasonings.length > 0) {
        const recipeSeasonings = createRecipeDto.seasonings.map(
          (seasoningDto) =>
            this.recipeSeasoningRepository.create({
              recipeId: savedRecipe.id,
              seasoningId: seasoningDto.seasoningId,
              amount: seasoningDto.amount,
            }),
        );
        await this.recipeSeasoningRepository.save(recipeSeasonings);
      }

      if (createRecipeDto.tools && createRecipeDto.tools.length > 0) {
        const recipeTools = createRecipeDto.tools.map((toolDto) =>
          this.recipeToolRepository.create({
            recipeId: savedRecipe.id,
            toolId: toolDto.toolId,
          }),
        );
        await this.recipeToolRepository.save(recipeTools);
      }

      if (createRecipeDto.steps && createRecipeDto.steps.length > 0) {
        const recipeSteps = createRecipeDto.steps.map((stepDto) =>
          this.recipeStepRepository.create({
            recipeId: savedRecipe.id,
            orderNum: stepDto.orderNum,
            imageUrl: stepDto.imageUrl,
            summary: stepDto.summary,
            content: stepDto.content,
          }),
        );
        await this.recipeStepRepository.save(recipeSteps);
      }

      if (
        createRecipeDto.healthPoints &&
        createRecipeDto.healthPoints.length > 0
      ) {
        const recipeHealthPoints = createRecipeDto.healthPoints.map(
          (healthPointDto) =>
            this.recipeHealthPointRepository.create({
              recipeId: savedRecipe.id,
              content: healthPointDto.content,
            }),
        );
        await this.recipeHealthPointRepository.save(recipeHealthPoints);
      }

      // 컨디션별 가중치 저장
      if (
        createRecipeDto.conditionWeights &&
        createRecipeDto.conditionWeights.length > 0
      ) {
        const recipeRecommendationConditions =
          createRecipeDto.conditionWeights.map((conditionWeight) =>
            this.recipeRecommendationConditionRepository.create({
              recipeId: savedRecipe.id,
              conditionId: conditionWeight.conditionId,
              priorityScore: conditionWeight.priorityScore,
            }),
          );
        await this.recipeRecommendationConditionRepository.save(
          recipeRecommendationConditions,
        );
        this.logger.log(
          `레시피 ${savedRecipe.id}의 컨디션별 가중치 ${recipeRecommendationConditions.length}개 저장 완료`,
        );
      }

      const createdRecipe = await this.recipeRepository.findOne({
        where: { id: savedRecipe.id },
      });

      if (!createdRecipe) {
        throw new CustomException(ERROR_CODES.RECIPE_CREATE_FAILED);
      }

      return createdRecipe;
    } catch (error) {
      this.logger.error('레시피 생성 중 에러 발생', error);
      throw new CustomException(ERROR_CODES.RECIPE_CREATE_FAILED);
    }
  }

  async getRecipe(
    userId: number,
    recipeId: number,
  ): Promise<GetRecipeResponseDto> {
    try {
      const recipe = await this.recipeRepository.findOne({
        where: { id: recipeId },
      });
      if (!recipe) {
        throw new CustomException(ERROR_CODES.RECIPE_NOT_FOUND);
      }

      const [
        images,
        recipeIngredients,
        recipeSeasonings,
        recipeTools,
        steps,
        healthPoints,
        userBookmark,
      ] = await Promise.all([
        this.recipeImageRepository.find({ where: { recipeId } }),
        this.recipeIngredientRepository.find({ where: { recipeId } }),
        this.recipeSeasoningRepository.find({ where: { recipeId } }),
        this.recipeToolRepository.find({ where: { recipeId } }),
        this.recipeStepRepository.find({ where: { recipeId } }),
        this.recipeHealthPointRepository.find({ where: { recipeId } }),
        this.userRecipeBookmarkRepository.findOne({
          where: { userId, recipeId },
        }),
      ]);

      const ingredientIds = recipeIngredients.map((item) => item.ingredientId);
      const seasoningIds = recipeSeasonings.map((item) => item.seasoningId);
      const toolIds = recipeTools.map((item) => item.toolId);

      const [ingredients, seasonings, tools] = await Promise.all([
        ingredientIds.length
          ? this.ingredientRepository.find({ where: { id: In(ingredientIds) } })
          : [],
        seasoningIds.length
          ? this.seasoningRepository.find({ where: { id: In(seasoningIds) } })
          : [],
        toolIds.length
          ? this.toolRepository.find({ where: { id: In(toolIds) } })
          : [],
      ]);

      const ingredientMap = new Map<number, Ingredient>();
      ingredients.forEach((ingredient) =>
        ingredientMap.set(ingredient.id, ingredient),
      );

      const seasoningMap = new Map<number, Seasoning>();
      seasonings.forEach((seasoning) =>
        seasoningMap.set(seasoning.id, seasoning),
      );

      const toolMap = new Map<number, Tool>();
      tools.forEach((tool) => toolMap.set(tool.id, tool));

      const recipeIngredientsWithDetail: RecipeIngredientDetail[] =
        recipeIngredients.map((item) => ({
          ingredientId: item.ingredientId,
          name: ingredientMap.get(item.ingredientId)?.name ?? '',
          amount: item.amount,
          isAlternative: item.isAlternative,
        }));

      const userOwnedIngredients = await this.getUserOwnedIngredients(userId);
      const durationName = await this.commonCodeService.findCommonCode(
        recipe.duration,
      );
      return {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        duration: durationName.codeName,
        images: images.map((image) => ({
          id: image.id,
          imageUrl: image.imageUrl,
        })),
        ingredients: this.mapIngredientsWithOwnership(
          recipeIngredientsWithDetail,
          userOwnedIngredients,
        ),
        seasonings: recipeSeasonings.map((seasoning) => ({
          id: seasoning.seasoningId,
          name: seasoningMap.get(seasoning.seasoningId)?.name ?? '',
          amount: seasoning.amount,
        })),
        tools: recipeTools.map((tool) => ({
          id: tool.toolId,
          name: toolMap.get(tool.toolId)?.name ?? '',
          imageUrl: toolMap.get(tool.toolId)?.imageUrl ?? '',
        })),
        steps: steps
          .sort((a, b) => a.orderNum - b.orderNum)
          .map((step) => ({
            orderNum: step.orderNum,
            summary: step.summary,
          })),
        healthPoints: healthPoints.map((healthPoint) => ({
          content: healthPoint.content,
        })),
        isBookmarked: !!userBookmark,
      };
    } catch (error) {
      this.logger.error('레시피 조회 중 에러 발생', error);
      throw new CustomException(ERROR_CODES.RECIPE_GET_FAILED);
    }
  }

  private async getUserOwnedIngredients(userId: number): Promise<number[]> {
    try {
      const cacheKey = `user:${userId}:owned_ingredients`;
      const cachedIngredients = await this.cacheService.get(cacheKey);
      this.logger.log(
        `Cached ingredients for user ${userId}: ${cachedIngredients}`,
      );
      if (cachedIngredients) {
        if (typeof cachedIngredients === 'string') {
          return JSON.parse(cachedIngredients);
        }
      }
      return [];
    } catch (error) {
      this.logger.error('Failed to get cached ingredients', error);
      throw new CustomException(ERROR_CODES.RECIPE_GET_FAILED);
    }
  }

  private mapIngredientsWithOwnership(
    recipeIngredients: RecipeIngredientDetail[],
    userOwnedIngredients: number[],
  ): RecipeIngredientDto {
    const ownedIngredientIds = userOwnedIngredients ?? [];

    const owned: RecipeIngredientDto['owned'] = [];
    const notOwned: RecipeIngredientDto['notOwned'] = [];
    const alternativeUnavailable: RecipeIngredientDto['alternativeUnavailable'] =
      [];

    recipeIngredients.forEach((ingredient) => {
      const ingredientItem = {
        id: ingredient.ingredientId,
        name: ingredient.name,
        amount: ingredient.amount,
        isAlternative: ingredient.isAlternative,
      };

      if (ownedIngredientIds.includes(ingredient.ingredientId)) {
        owned.push(ingredientItem);
      } else {
        notOwned.push(ingredientItem);
      }

      if (!ingredient.isAlternative) {
        alternativeUnavailable.push(ingredientItem);
      }
    });

    return {
      owned,
      notOwned,
      alternativeUnavailable,
    };
  }
}
