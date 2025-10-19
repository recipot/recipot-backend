import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('user_health_survey_effects')
export class UserHealthSurveyEffect extends CommonEntity {
  @Column({
    type: 'int',
    name: 'user_health_survey_id',
    nullable: false,
    comment: '유저 건강 설문 PK',
  })
  userHealthSurveyId: number;

  @Column({
    type: 'varchar',
    length: 6,
    name: 'effect_code',
    nullable: false,
    comment: '느낀 변화 코드 (공통 코드, H02)',
  })
  effectCode: string;
}
