import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('user_completed_recipes')
export class UserCompletedRecipe extends CommonEntity {
  // deletedAt 필드를 오버라이드하여 제거
  deletedAt: undefined;
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

  @Column({
    type: 'boolean',
    default: false,
    name: 'is_completed',
    comment: '완료 여부',
  })
  isCompleted: boolean;

  /**
   * @deprecated Use reviewCount instead. This field is no longer updated.
   * Will be removed in a future migration.
   */
  @Column({
    type: 'boolean',
    default: false,
    name: 'is_reviewed',
    comment: '후기 작성 여부 (Deprecated: reviewCount 사용 권장)',
  })
  isReviewed: boolean;

  @Column({
    type: 'int',
    default: 0,
    name: 'review_count',
    comment: '후기 작성 횟수',
  })
  reviewCount: number;
}
