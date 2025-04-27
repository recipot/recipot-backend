import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from './common.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'logins' })
export class LoginEntity extends CommonEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true })
  public passid: string;

  @Column({})
  public password: string;

  @OneToOne(() => UserEntity, (user) => user.login)
  public user: UserEntity;
}
