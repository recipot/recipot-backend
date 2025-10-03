import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ReplaceRecipeIdWithCompletedId20250928000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user_recipe_reviews',
      new TableColumn({
        name: 'user_completed_recipe_id',
        type: 'int',
        isNullable: true,
        comment: '완료된 레시피 기록 PK',
      }),
    );

    await queryRunner.query(`
      UPDATE user_recipe_reviews urr
      JOIN user_completed_recipes ucr
        ON urr.user_id = ucr.user_id
       AND urr.recipe_id = ucr.recipe_id
      SET urr.user_completed_recipe_id = ucr.id
      WHERE ucr.is_completed = 1
    `);

    await queryRunner.changeColumn(
      'user_recipe_reviews',
      'user_completed_recipe_id',
      new TableColumn({
        name: 'user_completed_recipe_id',
        type: 'int',
        isNullable: false,
        comment: '완료된 레시피 기록 PK',
      }),
    );

    await queryRunner.dropColumn('user_recipe_reviews', 'recipe_id');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user_recipe_reviews',
      new TableColumn({
        name: 'recipe_id',
        type: 'int',
        isNullable: true,
        comment: '레시피 PK',
      }),
    );

    await queryRunner.query(`
      UPDATE user_recipe_reviews urr
      JOIN user_completed_recipes ucr
        ON urr.user_completed_recipe_id = ucr.id
      SET urr.recipe_id = ucr.recipe_id
    `);

    await queryRunner.changeColumn(
      'user_recipe_reviews',
      'recipe_id',
      new TableColumn({
        name: 'recipe_id',
        type: 'int',
        isNullable: false,
        comment: '레시피 PK',
      }),
    );

    await queryRunner.dropColumn(
      'user_recipe_reviews',
      'user_completed_recipe_id',
    );
  }
}
