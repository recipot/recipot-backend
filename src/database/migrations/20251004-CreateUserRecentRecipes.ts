import { Table } from 'typeorm';

module.exports = class Migration20251004002135 {
  async up(queryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_recent_recipes',
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
        indices: [
          {
            name: 'IDX_user_recent_recipes_user_id_created_at',
            columnNames: ['user_id', 'created_at'],
          },
        ],
        uniques: [
          {
            name: 'UQ_user_recent_recipes_user_id_recipe_id',
            columnNames: ['user_id', 'recipe_id'],
          },
        ],
        comment: '최근 본 레시피 테이블',
      }),
    );
  }

  async down(queryRunner): Promise<void> {
    await queryRunner.dropTable('user_recent_recipes');
  }
};
