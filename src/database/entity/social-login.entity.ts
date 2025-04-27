import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '@/database/entity/common.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'social_logins' })
export class SocialLoginEntity extends CommonEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public type: string;

  @Column({ unique: true })
  public sid: string;

  @OneToOne(() => UserEntity, (user) => user.socialLogin)
  public user: UserEntity;
}
