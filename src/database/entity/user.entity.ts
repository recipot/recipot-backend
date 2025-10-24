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
    name: 'profile_image_url',
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
    name: 'recipe_complete_count',
    comment: '레시피 완료 횟수',
  })
  recipeCompleteCount: number;

  @Column({
    type: 'int',
    default: 1,
    name: 'level',
    comment: '사용자 레벨 (0~2: L1, 3~6: L2, 7~15: L3, 16+: L4)',
  })
  level: number;

  @Column({
    type: 'boolean',
    default: true,
    name: 'is_first_entry',
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
