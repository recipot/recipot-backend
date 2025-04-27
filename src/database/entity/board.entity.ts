import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CommonEntity } from '@/database/entity/common.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'boards' })
export class BoardEntity extends CommonEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'createdBy' })
  createdBy: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'updatedBy' })
  updatedBy: UserEntity;
}
