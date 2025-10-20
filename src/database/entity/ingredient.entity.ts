import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('ingredients')
export class Ingredient extends CommonEntity {
  @Column({
    type: 'int',
    name: 'ingredient_category_id',
    comment: '재료 카테고리 PK',
  })
  ingredientCategoryId: number;

  @Column({
    type: 'varchar',
    comment: '재료 이름 (예: 고등어, 게 등)',
  })
  name: string;

  @Column({
    type: 'boolean',
    name: 'is_restricted_ingredient',
    default: false,
    comment: '온보딩 단계에서 노출하는 제한 식품 여부',
  })
  isRestrictedIngredient: boolean;
}
