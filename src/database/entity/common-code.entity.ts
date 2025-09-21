import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('common_codes')
export class CommonCode extends CommonEntity {
  @Column({
    name: 'group_code',
    type: 'varchar',
    length: 3,
    comment: '그룹 코드',
  })
  groupCode: string;

  @Column({
    name: 'group_code_name',
    type: 'varchar',
    comment: '그룹 코드명',
  })
  groupCodeName: string;

  @Column({
    type: 'varchar',
    length: 6,
    comment: '코드',
  })
  code: string;

  @Column({
    name: 'code_name',
    type: 'varchar',
    comment: '코드명',
  })
  codeName: string;

  @Column({
    name: 'group_name',
    type: 'varchar',
    comment: '그룹명',
  })
  groupName: string;

  @Column({
    name: 'order_num',
    type: 'int',
    comment: '정렬 순서',
  })
  orderNum: number;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    comment: '사용 여부',
  })
  isActive: boolean;

  @Column({
    type: 'int',
    comment: '코드 깊이',
  })
  depth: number;
}
