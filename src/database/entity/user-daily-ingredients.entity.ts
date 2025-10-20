import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('user_daily_ingredients')
export class UserDailyIngredients extends CommonEntity {
  @Column({
    type: 'int',
    name: 'user_daily_condition_id',
    comment: '일일 유저 컨디션 테이블 PK',
  })
  userDailyConditionId: number;

  @Column({
    type: 'int',
    name: 'ingredient_id',
    comment: '재료 PK',
  })
  ingredientId: number;
}
