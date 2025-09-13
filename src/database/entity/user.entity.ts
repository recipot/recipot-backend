import { UserRole } from '@/api/user/enums/role.enum';
import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('users')
export class User extends CommonEntity {
  @Column({
    type: 'varchar',
    comment: '이메일',
  })
  email: string;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: '프로필 이미지 주소',
  })
  profileImageUrl: string;

  @Column({
    type: 'varchar',
    comment: '닉네임',
  })
  nickname: string;

  @Column({
    type: 'int',
    default: 0,
    comment: '레시피 완료 횟수',
  })
  recipeCompleteCount: number;

  @Column({
    type: 'boolean',
    default: false,
    comment: '최초 진입 여부',
  })
  isFirstEntry: boolean;

  @Column({
    type: 'varchar',
    length: 6,
    enum: UserRole,
    default: UserRole.GENERAL,
    comment: '유저 권한 (공통 코드)',
  })
  role: UserRole;
}
