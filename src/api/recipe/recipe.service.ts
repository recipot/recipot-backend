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
  ) {}

  @Transactional()
  async createRecipe(createRecipeDto: CreateRecipeDto): Promise<Recipe> {
    try {
      const recipe = this.recipeRepository.create({
        title: createRecipeDto.title,
        description: createRecipeDto.description,
        duration: createRecipeDto.duration,
        level: createRecipeDto.level,
      });

      const savedRecipe = await this.recipeRepository.save(recipe);

      if (createRecipeDto.images && createRecipeDto.images.length > 0) {
        const recipeImages = createRecipeDto.images.map((imageDto) =>
          this.recipeImageRepository.create({
            recipe_id: savedRecipe.id,
            image_url: imageDto.imageUrl,
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
              recipe_id: savedRecipe.id,
              ingredient_id: ingredientDto.ingredientId,
              is_alternative: ingredientDto.isAlternative,
              amount: ingredientDto.amount,
            }),
        );
        await this.recipeIngredientRepository.save(recipeIngredients);
      }

      if (createRecipeDto.seasonings && createRecipeDto.seasonings.length > 0) {
        const recipeSeasonings = createRecipeDto.seasonings.map(
          (seasoningDto) =>
            this.recipeSeasoningRepository.create({
              recipe_id: savedRecipe.id,
              seasoning_id: seasoningDto.seasoningId,
              amount: seasoningDto.amount,
            }),
        );
        await this.recipeSeasoningRepository.save(recipeSeasonings);
      }

      if (createRecipeDto.tools && createRecipeDto.tools.length > 0) {
        const recipeTools = createRecipeDto.tools.map((toolDto) =>
          this.recipeToolRepository.create({
            recipe_id: savedRecipe.id,
            tool_id: toolDto.toolId,
          }),
        );
        await this.recipeToolRepository.save(recipeTools);
      }

      if (createRecipeDto.steps && createRecipeDto.steps.length > 0) {
        const recipeSteps = createRecipeDto.steps.map((stepDto) =>
          this.recipeStepRepository.create({
            recipe_id: savedRecipe.id,
            order_num: stepDto.orderNum,
            image_url: stepDto.imageUrl,
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
              recipe_id: savedRecipe.id,
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
        ],
      });

      return result;
    } catch (error) {
      this.logger.error('레시피 생성 중 에러 발생', {
        error: error.message,
        stack: error.stack,
        name: error.name,
        createRecipeDto,
      });

      throw new CustomException(ERROR_CODES.RECIPE_CREATE_FAILED);
    }
  }
}
