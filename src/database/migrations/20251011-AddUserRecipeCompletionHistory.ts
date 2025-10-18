import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddUserRecipeCompletionHistory1760201234567
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_recipe_completion_history',
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
            name: 'completed_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            comment: '완료 시각',
          },
        ],
        indices: [
          {
            name: 'IDX_urc_user_id_completed_at',
            columnNames: ['user_id', 'completed_at'],
          },
          {
            name: 'IDX_urc_user_id_recipe_id_completed_at',
            columnNames: ['user_id', 'recipe_id', 'completed_at'],
          },
        ],
        comment: '레시피 완료 이력(완료할 때마다 1행 적재)',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_recipe_completion_history');
  }
}
