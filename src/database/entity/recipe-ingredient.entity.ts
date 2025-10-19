import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
