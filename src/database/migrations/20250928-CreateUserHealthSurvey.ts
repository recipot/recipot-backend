import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUserHealthSurveyTables20250929000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_health_surveys',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: '유저 건강 설문 PK',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
            comment: '유저 PK',
          },
          {
            name: 'persistent_issue_code',
            type: 'varchar',
            length: '6',
            isNullable: false,
            comment: '평소 겪던 건강 문제 코드 (공통 코드)',
          },
          {
            name: 'additional_note',
            type: 'text',
            isNullable: true,
            comment: '자유 서술 응답',
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        comment: '유저 건강 설문 본문 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'user_health_survey_effects',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: '유저 건강 설문 변화 PK',
          },
          {
            name: 'user_health_survey_id',
            type: 'int',
            isNullable: false,
            comment: '유저 건강 설문 PK',
          },
          {
            name: 'effect_code',
            type: 'varchar',
            length: '6',
            isNullable: false,
            comment: '느낀 변화 코드 (공통 코드)',
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        comment: '유저 건강 설문 변화 선택 테이블',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_health_survey_effects');
    await queryRunner.dropTable('user_health_surveys');
  }
}
