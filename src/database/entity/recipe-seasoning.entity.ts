// src/database/entity/recipe-seasoning.entity.ts
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Recipe } from './recipe.entity';
import { Seasoning } from './seasoning.entity';

@Entity('recipe_seasonings')
export class RecipeSeasoning {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'int',
    nullable: false,
    name: 'recipe_id',
    comment: '레시피 PK',
  })
  recipeId: number;

  @Column({
    type: 'int',
    nullable: false,
    name: 'seasoning_id',
    comment: '양념 PK',
  })
  seasoningId: number;

  @Column({
    type: 'varchar',
    nullable: false,
    comment: '필요량',
  })
  amount: string;

  @ManyToOne(() => Recipe, (recipe) => recipe.seasonings)
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;

  @ManyToOne(() => Seasoning)
  @JoinColumn({ name: 'seasoning_id' })
  seasoning: Seasoning;
}
