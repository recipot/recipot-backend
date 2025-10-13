import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('user_recipe_recommendation')
export class UserRecipeRecommendation {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    comment: '생성일시',
  })
  createdAt: Date;

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
    length: 10,
    name: 'based_on',
    comment: '추천 근거 (공통코드)',
  })
  basedOn: string;

  @Column({
    type: 'float',
    default: 1.0,
    comment: '종합 점수 (예: 가중치 * 재료 충족률)',
  })
  score: number;

  @Column({
    type: 'float',
    default: 0.0,
    name: 'ingredient_fulfillment_rate',
    comment: '재료 충족률 (0.0 ~ 1.0)',
  })
  ingredientFulfillmentRate: number;

  @Column({
    type: 'json',
    name: 'missing_ingredient_ids',
    comment: '부족한 재료 ID 배열',
    nullable: true,
  })
  missingIngredientIds: number[];

  @Column({
    type: 'varchar',
    length: 255,
    name: 'redis_hash_key',
    comment: 'Redis 캐시 해시키',
    nullable: true,
  })
  redisHashKey: string;
}
