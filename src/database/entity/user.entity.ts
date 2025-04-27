import {
  Column,
  Entity,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { CommonEntity } from '@/database/entity/common.entity';
import { SocialLoginEntity } from './social-login.entity';
import { BoardEntity } from '@/database/entity/board.entity';
import { LoginEntity } from './login.entity';

@Entity({ name: 'users' })
export class UserEntity extends CommonEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public nickName: string;

  @Column()
  public cookingLevel: string;

  @Column()
  public householdType: string;

  @Column()
  public job: string;

  @OneToOne(() => SocialLoginEntity, { nullable: true })
  @JoinColumn({ name: 'socialLogin_id' })
  public socialLogin?: SocialLoginEntity;

  @OneToOne(() => LoginEntity, { nullable: true })
  @JoinColumn({ name: 'login_id' })
  public login?: LoginEntity;

  @OneToMany(() => BoardEntity, (board) => board.createdBy)
  public boards?: BoardEntity[]; // Define the reverse relationship
}
