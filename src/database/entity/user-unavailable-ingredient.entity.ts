import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Ingredient } from './ingredient.entity';

@Entity('user_unavailable_ingredients')
export class UserUnavailableIngredient {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'int',
    nullable: false,
    comment: '유저 PK',
  })
  user_id: number;

  @Column({
    type: 'int',
    nullable: false,
    comment: '재료 PK',
  })
  ingredient_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Ingredient)
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;
}
