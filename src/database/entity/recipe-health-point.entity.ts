import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CommonEntity } from './common.entity';
import { Recipe } from './recipe.entity';

@Entity('recipe_health_points')
export class RecipeHealthPoint extends CommonEntity {
  @Column({
    type: 'int',
    nullable: false,
    comment: '레시피 PK',
  })
  recipe_id: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: '한줄 건강 포인트',
  })
  content: string;

  @ManyToOne(() => Recipe, (recipe) => recipe.healthPoints)
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;
}
