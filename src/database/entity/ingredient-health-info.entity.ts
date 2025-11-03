import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('ingredient_health_infos')
export class IngredientHealthInfo extends CommonEntity {
  @Column({
    type: 'int',
    name: 'ingredient_id',
    comment: '재료 PK',
  })
  ingredientId: number;

  @Column({
    type: 'text',
    comment: '건강 정보 내용',
    nullable: true,
  })
  content: string | null;
}
