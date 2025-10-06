import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('user_recipe_recommendation')
export class UserRecipeRecommendation extends CommonEntity {
  @Column({
    type: 'bigint',
    name: 'user_id',
    comment: '유저 PK',
  })
  userId: number;

  @Column({
    type: 'bigint',
    name: 'recipe_id',
    comment: '레시피 PK',
  })
  recipeId: number;

  @Column({
    type: 'bigint',
    name: 'condition_id',
    comment: '컨디션 PK',
  })
  conditionId: number;

  @Column({
    type: 'varchar',
    name: 'based_on',
    comment: '추천 근거',
  })
  basedOn: string;

  @Column({
    type: 'float',
    default: 1.0,
    comment: '종합 점수 (예: 가중치 * 재료 충족률)',
  })
  score: number;
}
