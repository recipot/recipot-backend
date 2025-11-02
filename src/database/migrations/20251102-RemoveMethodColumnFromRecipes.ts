import { QueryRunner, TableColumn } from 'typeorm';

module.exports = class Migration20251102000002 {
  async up(queryRunner: QueryRunner) {
    // recipe 테이블에서 method 컬럼 제거
    const hasMethod = await queryRunner.hasColumn('recipes', 'method');
    if (hasMethod) {
      await queryRunner.dropColumn('recipes', 'method');
    }
  }

  async down(queryRunner: QueryRunner) {
    // method 컬럼 복구 (되돌리기 시)
    const hasMethod = await queryRunner.hasColumn('recipes', 'method');
    if (!hasMethod) {
      await queryRunner.addColumn(
        'recipes',
        new TableColumn({
          name: 'method',
          type: 'varchar',
          length: '6',
          comment: '조리 방식',
          isNullable: false,
          default: "''",
        }),
      );
    }
  }
};
