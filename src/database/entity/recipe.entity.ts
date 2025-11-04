import { Column, DeleteDateColumn, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('recipes')
export class Recipe extends CommonEntity {
  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
    nullable: true,
    comment: '삭제일시',
  })
  deletedAt: Date | null;

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
    type: 'int',
    comment: '소요 시간 (분)',
  })
  duration: number;
}
