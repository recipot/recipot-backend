import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

module.exports = class Migration20251015204824 {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('recipes', 'condition_id');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'recipes',
      new TableColumn({
        name: 'condition_id',
        type: 'int',
        isNullable: false,
        comment: '컨디션 PK',
      }),
    );
  }
};
