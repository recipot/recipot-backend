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
    comment: '생성일시',
  })
  created_at: Date;

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
