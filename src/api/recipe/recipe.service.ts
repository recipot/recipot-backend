import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Recipe } from '@/database/entity/recipe.entity';
import { RecipeImage } from '@/database/entity/recipe-image.entity';
import { RecipeIngredient } from '@/database/entity/recipe-ingredient.entity';
import { RecipeSeasoning } from '@/database/entity/recipe-seasoning.entity';
import { RecipeTool } from '@/database/entity/recipe-tool.entity';
import { RecipeStep } from '@/database/entity/recipe-step.entity';
import { RecipeHealthPoint } from '@/database/entity/recipe-health-point.entity';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { CustomException } from '@/common/exceptions/custom-exception';
import { ERROR_CODES } from '@/common/constants/error-codes';
import {
  GetRecipeResponseDto,
  RecipeIngredientDto,
} from './dto/get-recipe.dto';
import { CacheService } from '@/common/cache/cache.service';
import { CommonCodeService } from '../common-code/common-code.service';

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
        conditionId: createRecipeDto.conditionId,
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

      const result = await this.recipeRepository.findOne({
        where: { id: savedRecipe.id },
        relations: [
          'images',
          'ingredients',
          'ingredients.ingredient',
          'seasonings',
          'seasonings.seasoning',
          'tools',
          'tools.tool',
          'steps',
          'healthPoints',
          'condition',
        ],
      });

      return result;
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
        relations: [
          'images',
          'ingredients',
          'ingredients.ingredient',
          'seasonings',
          'seasonings.seasoning',
          'tools',
          'tools.tool',
          'steps',
          'healthPoints',
          'condition',
        ],
      });
      if (!recipe) {
        throw new CustomException(ERROR_CODES.RECIPE_NOT_FOUND);
      }
      const userOwnedIngredients = await this.getUserOwnedIngredients(userId);
      const durationName = await this.commonCodeService.findCommonCode(
        recipe.duration,
      );
      return {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        duration: durationName.codeName,
        condition: {
          id: recipe.condition.id,
          name: recipe.condition.name,
        },
        images: recipe.images.map((image) => ({
          id: image.id,
          imageUrl: image.imageUrl,
        })),
        ingredients: this.mapIngredientsWithOwnership(
          recipe.ingredients,
          userOwnedIngredients,
        ),
        seasonings: recipe.seasonings.map((seasoning) => ({
          id: seasoning.seasoning.id,
          name: seasoning.seasoning.name,
          amount: seasoning.amount,
        })),
        tools: recipe.tools.map((tool) => ({
          id: tool.tool.id,
          name: tool.tool.name,
          imageUrl: tool.tool.imageUrl,
        })),
        steps: recipe.steps
          .sort((a, b) => a.orderNum - b.orderNum)
          .map((step) => ({
            orderNum: step.orderNum,
            summary: step.summary,
          })),
        healthPoints: recipe.healthPoints.map((healthPoint) => ({
          content: healthPoint.content,
        })),
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
    recipeIngredients: any[],
    userOwnedIngredients: number[],
  ): RecipeIngredientDto {
    const ownedIngredients = userOwnedIngredients || [];

    const owned = [];
    const notOwned = [];
    const alternativeUnavailable = [];

    recipeIngredients.forEach((recipeIngredient) => {
      const ingredientId = recipeIngredient.ingredient.id;
      const isOwned = ownedIngredients.includes(ingredientId);
      const isAlternative = recipeIngredient.isAlternative;

      const ingredientItem = {
        id: ingredientId,
        name: recipeIngredient.ingredient.name,
        amount: recipeIngredient.amount,
        isAlternative: isAlternative,
      };

      if (isOwned) {
        owned.push(ingredientItem);
      } else {
        notOwned.push(ingredientItem);
      }

      if (!isAlternative) {
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
