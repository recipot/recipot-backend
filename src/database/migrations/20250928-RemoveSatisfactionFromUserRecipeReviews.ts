import { TableColumn } from 'typeorm';

module.exports = class Migration20250928000123 {
  async up(queryRunner) {
    const table = await queryRunner.getTable('user_recipe_reviews');
    const satisfactionColumn = table?.findColumnByName('satisfaction');

    if (satisfactionColumn) {
      await queryRunner.dropColumn(
        'user_recipe_reviews',
        new TableColumn({
          name: 'satisfaction',
          type: 'varchar',
          length: '6',
        }),
      );
    }
  }

  async down(queryRunner) {
    await queryRunner.addColumn(
      'user_recipe_reviews',
      new TableColumn({
        name: 'satisfaction',
        type: 'varchar',
        length: '6',
        isNullable: false,
        comment: '전체 만족도 코드',
      }),
    );
  }
};
