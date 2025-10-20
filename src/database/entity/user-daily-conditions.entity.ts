import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

export enum TimeSlot {
  MORNING = 'morning',
  LUNCH = 'lunch',
  DINNER = 'dinner',
}

@Entity('user_daily_conditions')
export class UserDailyConditions extends CommonEntity {
  @Column({
    type: 'int',
    name: 'user_id',
    comment: '유저 PK',
  })
  userId: number;

  @Column({
    type: 'int',
    name: 'condition_id',
    comment: '컨디션 PK',
  })
  conditionId: number;

  @Column({
    type: 'date',
    comment: '날짜',
  })
  date: Date;

  @Column({
    type: 'enum',
    enum: TimeSlot,
    name: 'time_slot',
    comment: '추천 시간대',
  })
  timeSlot: TimeSlot;
}
