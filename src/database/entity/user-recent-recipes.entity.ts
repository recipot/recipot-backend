import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('user_recent_recipes')
export class UserRecentRecipes extends CommonEntity {
  @Column({
    type: 'int',
    name: 'user_id',
    comment: '유저 PK',
  })
  userId: number;

  @Column({
    type: 'int',
    name: 'recipe_id',
    comment: '레시피 PK',
  })
  recipeId: number;
}
