import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('recipes')
export class Recipe extends CommonEntity {
  @Column({
    type: 'varchar',
    length: 255,
    comment: '타이틀',
  })
  title: string;

  @Column({
    type: 'text',
    comment: '설명',
  })
  description: string;

  @Column({
    type: 'varchar',
    length: 6,
    comment: '소요 시간',
  })
  duration: string;

  @Column({
    type: 'int',
    nullable: false,
    name: 'condition_id',
    comment: '컨디션 PK',
  })
  conditionId: number;
}
