import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('user_health_surveys')
export class UserHealthSurvey extends CommonEntity {
  @Column({
    type: 'int',
    name: 'user_id',
    nullable: false,
    comment: '유저 PK',
  })
  userId: number;

  @Column({
    type: 'varchar',
    length: 6,
    name: 'persistent_issue_code',
    nullable: false,
    comment: '평소 겪던 건강 문제 코드 (공통 코드, H01)',
  })
  persistentIssueCode: string;

  @Column({
    type: 'text',
    name: 'additional_note',
    nullable: true,
    comment: '자유 서술 응답',
  })
  additionalNote: string | null;
}
