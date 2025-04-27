import { BaseEntity, CreateDateColumn, PrimaryColumn } from 'typeorm';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'common_code' })
export abstract class CommonCodeEntity extends BaseEntity {
  @PrimaryColumn()
  code: string;

  @Column()
  group_code: string;

  @Column()
  name: string;

  @Column()
  remark: string;

  @Column()
  sort_order: number;

  @Column()
  use_yn: string;

  @Column()
  depth: number;

  @CreateDateColumn()
  created_at: Date;

  @Column()
  created_by: string;
}
