import { Table } from 'typeorm';

module.exports = class Migration20250905190814 {
  async up(queryRunner) {
    await queryRunner.createTable(
      new Table({
        name: 'user_recent_view_recipes',
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
            name: 'recipe_id',
            type: 'int',
            isNullable: false,
            comment: '레시피 PK',
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
        comment: '유저 최근 조회 레시피 테이블',
      }),
    );
  }

  async down(queryRunner) {
    await queryRunner.dropTable('user_recent_view_recipes');
  }
};
