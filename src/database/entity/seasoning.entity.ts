import { Column, DeleteDateColumn, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('seasonings')
export class Seasoning extends CommonEntity {
  @Column({
    type: 'varchar',
    nullable: false,
    comment: '양념 이름',
  })
  name: string;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
    nullable: true,
    comment: '삭제일시',
  })
  deletedAt: Date | null;
}
