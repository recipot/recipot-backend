import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CommonEntity } from './common.entity';
import { User } from './user.entity';

@Entity('social_logins')
export class SocialLogin extends CommonEntity {
  @Column({
    type: 'int',
    comment: '유저 PK',
  })
  user_id: number;

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

  @ManyToOne(() => User, (user) => user.social_logins)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
