import { BaseEntity, CreateDateColumn, PrimaryColumn } from 'typeorm';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'common_code_group' })
export abstract class CommonCodeGroupEntity extends BaseEntity {
  @PrimaryColumn()
  group_code: string;

  @Column()
  group_name: string;

  @Column()
  remark: string;

  @Column()
  use_yn: string;

  @CreateDateColumn()
  created_at: Date;

  @Column()
  created_by: string;
}
