import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('common_codes')
export class CommonCode extends CommonEntity {
  @Column({
    type: 'varchar',
    length: 3,
    comment: '그룹 코드',
  })
  group_code: string;

  @Column({
    type: 'varchar',
    comment: '그룹 코드명',
  })
  group_code_name: string;

  @Column({
    type: 'varchar',
    length: 6,
    comment: '코드',
  })
  code: string;

  @Column({
    type: 'varchar',
    comment: '코드명',
  })
  code_name: string;

  @Column({
    type: 'varchar',
    comment: '그룹명',
  })
  group_name: string;

  @Column({
    type: 'int',
    comment: '정렬 순서',
  })
  order_num: number;

  @Column({
    type: 'boolean',
    default: true,
    comment: '사용 여부',
  })
  is_active: boolean;

  @Column({
    type: 'int',
    comment: '코드 깊이',
  })
  depth: number;
}
