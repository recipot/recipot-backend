import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('social_logins')
export class SocialLogin extends CommonEntity {
  @Column({
    type: 'int',
    comment: '유저 PK',
  })
  userId: number;

  @Column({
    type: 'varchar',
    comment: '소셜 플랫폼 식별자',
  })
  sid: string;

  @Column({
    type: 'varchar',
    length: 6,
    comment: '플랫폼 구분 (kakao, google 등)',
  })
  platform: string;
}
