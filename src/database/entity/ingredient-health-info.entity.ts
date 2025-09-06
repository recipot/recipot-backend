import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CommonEntity } from './common.entity';
import { Ingredient } from './ingredient.entity';

@Entity('ingredient_health_infos')
export class IngredientHealthInfo extends CommonEntity {
  @Column({
    type: 'int',
    name: 'ingredient_id',
    comment: '재료 PK',
  })
  ingredient_id: number;

  @Column({
    type: 'text',
    comment: '건강 정보 내용',
  })
  content: string;

  @ManyToOne(() => Ingredient, { nullable: false })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;
}
