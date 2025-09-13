import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class CommonEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @CreateDateColumn({
    type: 'datetime',
    comment: '생성일시',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'datetime',
    comment: '수정일시',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
    nullable: true,
  })
  deletedAt: Date;
}
