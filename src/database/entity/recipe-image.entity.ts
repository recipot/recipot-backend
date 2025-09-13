import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('recipe_images')
export class RecipeImage extends CommonEntity {
  @Column({
    type: 'int',
    comment: '레시피 PK',
  })
  recipe_id: number;

  @Column({
    type: 'varchar',
    comment: '레시피 이미지 주소',
  })
  image_url: string;
}
