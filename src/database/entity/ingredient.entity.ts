import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CommonEntity } from './common.entity';
import { IngredientCategory } from './ingredient-category.entity';

@Entity('ingredients')
export class Ingredient extends CommonEntity {
  @Column({
    type: 'int',
    name: 'ingredient_category_id',
    comment: '재료 카테고리 PK',
  })
  ingredient_category_id: number;

  @Column({
    type: 'varchar',
    comment: '재료 이름 (예: 고등어, 게 등)',
  })
  name: string;

  @ManyToOne(() => IngredientCategory, { nullable: false })
  @JoinColumn({ name: 'ingredient_category_id' })
  ingredientCategory: IngredientCategory;
}
