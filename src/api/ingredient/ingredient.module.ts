import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngredientService } from './ingredient.service';
import { IngredientCategory } from '@/database/entity/ingredient-category.entity';
import { IngredientController } from './ingredient.controller';
import { IngredientHealthInfo } from '@/database/entity/ingredient-health-info.entity';
import { Ingredient } from '@/database/entity/ingredient.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IngredientCategory,
      Ingredient,
      IngredientHealthInfo,
    ]),
  ],
  controllers: [IngredientController],
  providers: [IngredientService],
  exports: [IngredientService],
})
export class IngredientModule {}
