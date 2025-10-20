import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('recipe_recommendation_condition')
export class RecipeRecommendationCondition extends CommonEntity {
  @Column({
    type: 'int',
    name: 'recipe_id',
    comment: '레시피 PK',
  })
  recipeId: number;

  @Column({
    type: 'int',
    name: 'condition_id',
    comment: '컨디션 PK',
  })
  conditionId: number;

  @Column({
    type: 'float',
    default: 1.0,
    name: 'priority_score',
    comment: '가중치 (높을수록 더 적합)',
  })
  priorityScore: number;
}
