import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class CommonEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    comment: '생성일시',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    comment: '수정일시',
  })
  updatedAt: Date;
}
