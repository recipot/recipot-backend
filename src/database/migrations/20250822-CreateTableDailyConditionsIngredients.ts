import { Table } from 'typeorm';

module.exports = class Migration20250822051736 {
  async up(queryRunner) {
    // user_daily_conditions 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: 'user_daily_conditions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'PK',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
            comment: '유저 PK',
          },
          {
            name: 'condition_id',
            type: 'int',
            isNullable: false,
            comment: '컨디션 PK',
          },
          {
            name: 'date',
            type: 'date',
            isNullable: false,
            comment: '날짜',
          },
          {
            name: 'time_slot',
            type: 'enum',
            enum: ['morning', 'lunch', 'dinner'],
            isNullable: false,
            comment: '추천 시간대',
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
        comment: '일일 유저 컨디션 테이블',
      }),
    );

    // user_daily_ingredients 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: 'user_daily_ingredients',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'PK',
          },
          {
            name: 'user_daily_condition_id',
            type: 'int',
            isNullable: false,
            comment: '일일 유저 컨디션 테이블 PK',
          },
          {
            name: 'ingredient_id',
            type: 'int',
            isNullable: false,
            comment: '재료 PK',
          },
        ],
        comment: '일일 유저 보유 재료 테이블',
      }),
    );
  }

  async down(queryRunner) {
    await queryRunner.dropTable('user_daily_ingredients');
    await queryRunner.dropTable('user_daily_conditions');
  }
};
