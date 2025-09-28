import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_unavailable_ingredients')
export class UserUnavailableIngredient {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'int',
    nullable: false,
    name: 'user_id',
    comment: '유저 PK',
  })
  userId: number;

  @Column({
    type: 'int',
    nullable: false,
    name: 'ingredient_id',
    comment: '재료 PK',
  })
  ingredientId: number;
}
