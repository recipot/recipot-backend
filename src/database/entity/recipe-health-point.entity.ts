import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('recipe_health_points')
export class RecipeHealthPoint extends CommonEntity {
  @Column({
    type: 'int',
    nullable: false,
    name: 'recipe_id',
    comment: '레시피 PK',
  })
  recipeId: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: '한줄 건강 포인트',
  })
  content: string;
}
