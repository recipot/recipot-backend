import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipeController } from './recipe.controller';
import { RecipeService } from './recipe.service';
import { Recipe } from '@/database/entity/recipe.entity';
import { RecipeImage } from '@/database/entity/recipe-image.entity';
import { RecipeIngredient } from '@/database/entity/recipe-ingredient.entity';
import { RecipeSeasoning } from '@/database/entity/recipe-seasoning.entity';
import { RecipeTool } from '@/database/entity/recipe-tool.entity';
import { RecipeStep } from '@/database/entity/recipe-step.entity';
import { RecipeHealthPoint } from '@/database/entity/recipe-health-point.entity';

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
    ]),
  ],
  controllers: [RecipeController],
  providers: [RecipeService],
  exports: [RecipeService],
})
export class RecipeModule {}
