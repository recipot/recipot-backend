import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('seasonings')
export class Seasoning extends CommonEntity {
  @Column({
    type: 'varchar',
    nullable: false,
    comment: '양념 이름',
  })
  name: string;
}
