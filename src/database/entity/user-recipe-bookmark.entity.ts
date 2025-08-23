import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CommonEntity } from './common.entity';
import { Recipe } from './recipe.entity';
import { User } from './user.entity';

@Entity('user_recipe_bookmarks')
export class UserRecipeBookmark extends CommonEntity {
  @Column({
    type: 'int',
    comment: '유저 PK',
  })
  user_id: number;

  @Column({
    type: 'int',
    comment: '레시피 PK',
  })
  recipe_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Recipe)
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;
}
