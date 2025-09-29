import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('recipe_steps')
export class RecipeStep extends CommonEntity {
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
    name: 'order_num',
    comment: '순서',
  })
  orderNum: number;

  @Column({
    type: 'varchar',
    nullable: false,
    name: 'image_url',
    comment: '요리 예시 이미지 주소',
  })
  imageUrl: string;

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
}
