import { CacheModule } from '@/common/cache/cache.module';
import { Condition } from '@/database/entity/condition.entity';
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
import { UserRecipeRecommendation } from '@/database/entity/user-recipe-recommendation.entity';
import { UserUnavailableIngredient } from '@/database/entity/user-unavailable-ingredient.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonCodeModule } from '../common-code/common-code.module';
import { RecipeRecommendationConditionService } from './recipe-recommend.service';
import { RecipeController } from './recipe.controller';
import { RecipeService } from './recipe.service';
import { CacheLockService } from './services/cache-lock.service';
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
      Condition,
      Ingredient,
      Seasoning,
      Tool,
      RecipeRecommendationCondition,
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
    CacheLockService,
    RecipeRecommendationService,
  ],
  exports: [RecipeService],
})
export class RecipeModule {}
