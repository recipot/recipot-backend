import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('conditions')
export class Condition extends CommonEntity {
  @Column({
    type: 'varchar',
    nullable: false,
    comment: '컨디션 이름',
  })
  name: string;
}
