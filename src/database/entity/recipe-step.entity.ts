import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CommonEntity } from './common.entity';
import { Recipe } from './recipe.entity';

@Entity('recipe_steps')
export class RecipeStep extends CommonEntity {
  @Column({
    type: 'int',
    nullable: false,
    comment: '레시피 PK',
  })
  recipe_id: number;

  @Column({
    type: 'int',
    nullable: false,
    comment: '순서',
  })
  order_num: number;

  @Column({
    type: 'varchar',
    nullable: false,
    comment: '요리 예시 이미지 주소',
  })
  image_url: string;

  @Column({
    type: 'text',
    nullable: false,
    comment: '요약',
  })
  summary: string;

  @Column({
    type: 'text',
    nullable: false,
    comment: '내용',
  })
  content: string;

  @ManyToOne(() => Recipe, (recipe) => recipe.steps)
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;
}
