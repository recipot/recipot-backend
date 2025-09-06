// src/database/entity/recipe-seasoning.entity.ts
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CommonEntity } from './common.entity';
import { Recipe } from './recipe.entity';
import { Seasoning } from './seasoning.entity';

@Entity('recipe_seasonings')
export class RecipeSeasoning extends CommonEntity {
  @Column({
    type: 'int',
    nullable: false,
    comment: '레시피 PK',
  })
  recipe_id: number;

  @Column({
    type: 'int',
    nullable: false,
    comment: '양념 PK',
  })
  seasoning_id: number;

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
