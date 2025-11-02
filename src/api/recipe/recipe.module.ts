import { CacheModule } from '@/common/cache/cache.module';
import { CommonCode } from '@/database/entity/common-code.entity';
import { Condition } from '@/database/entity/condition.entity';
import { IngredientCategory } from '@/database/entity/ingredient-category.entity';
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
import { UserRecipeRecommendation } from '@/database/entity/user-recipe-recommendation.entity';
import { UserUnavailableIngredient } from '@/database/entity/user-unavailable-ingredient.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonCodeModule } from '../common-code/common-code.module';
import { RecipeRecommendationConditionService } from './recipe-recommend.service';
import { RecipeController } from './recipe.controller';
import { RecipeService } from './recipe.service';
import { FileImportService } from './services/file-import.service';
import { RecipeRecommendationService } from './services/recipe-recommendation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Recipe,
      RecipeImage,
      RecipeIngredient,
      RecipeSeasoning,
      RecipeTool,
      RecipeStep,
      RecipeHealthPoint,
      RecipeRecommendationCondition,
      Ingredient,
      IngredientCategory,
      IngredientHealthInfo,
      Seasoning,
      Tool,
      UserRecipeBookmark,
      Condition,
      CommonCode,
      UserRecipeRecommendation,
      UserUnavailableIngredient,
    ]),
    CacheModule,
    CommonCodeModule,
  ],
  controllers: [RecipeController],
  providers: [
    RecipeService,
    RecipeRecommendationConditionService,
    RecipeRecommendationService,
    FileImportService,
  ],
  exports: [RecipeService],
})
export class RecipeModule {}
