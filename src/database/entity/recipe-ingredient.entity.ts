import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Recipe } from './recipe.entity';
import { Ingredient } from './ingredient.entity';

@Entity('recipe_ingredients')
export class RecipeIngredient {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'int',
    nullable: false,
    comment: '레시피 PK',
  })
  recipe_id: number;

  @Column({
    type: 'int',
    nullable: false,
    comment: '재료 PK',
  })
  ingredient_id: number;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
    comment: '대체 가능 여부',
  })
  is_alternative: boolean;

  @Column({
    type: 'varchar',
    nullable: false,
    comment: '개수 또는 양',
  })
  amount: string;

  @ManyToOne(() => Recipe, (recipe) => recipe.ingredients)
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;

  @ManyToOne(() => Ingredient)
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;
}
