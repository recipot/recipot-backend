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
    name: 'recipe_id',
    comment: '레시피 PK',
  })
  recipeId: number;

  @Column({
    type: 'int',
    nullable: false,
    name: 'ingredient_id',
    comment: '재료 PK',
  })
  ingredientId: number;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
    name: 'is_alternative',
    comment: '대체 가능 여부',
  })
  isAlternative: boolean;

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
