import { QueryRunner, Table, TableColumn } from 'typeorm';

module.exports = class Migration20251019210331 {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'ingredients',
      new TableColumn({
        name: 'is_restricted_ingredient',
        type: 'boolean',
        default: false,
        isNullable: false,
        comment: '온보딩 단계에서 노출하는 제한 식품 여부',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('ingredients', 'is_restricted_ingredient');
  }
};
