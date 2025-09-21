import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('ingredient_categories')
export class IngredientCategory extends CommonEntity {
  @Column({
    type: 'varchar',
    comment: '카테고리 이름 (해산물류, 육류 등)',
  })
  name: string;
}
