import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('recipe_images')
export class RecipeImage extends CommonEntity {
  @Column({
    type: 'int',
    name: 'recipe_id',
    comment: '레시피 PK',
  })
  recipeId: number;

  @Column({
    type: 'varchar',
    name: 'image_url',
    comment: '레시피 이미지 주소',
  })
  imageUrl: string;
}
