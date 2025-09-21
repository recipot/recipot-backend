import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Recipe } from './recipe.entity';
import { User } from './user.entity';

@Entity('user_recipe_bookmarks')
export class UserRecipeBookmark {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @CreateDateColumn({
    type: 'datetime',
    name: 'created_at',
    comment: '생성일시',
  })
  createdAt: Date;

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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Recipe)
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;
}
