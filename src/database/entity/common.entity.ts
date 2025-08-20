import {
  CreateDateColumn,
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
  created_at: Date;

  @UpdateDateColumn({
    type: 'datetime',
    comment: '수정일시',
  })
  updated_at: Date;
}
