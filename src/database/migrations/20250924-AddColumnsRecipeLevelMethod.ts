import { TableColumn } from 'typeorm';

module.exports = class Migration20250924000001 {
  async up(queryRunner) {
    // level 컬럼 추가 (존재하지 않을 때만)
    const existsLevel = await queryRunner.hasColumn('recipes', 'level');
    if (!existsLevel) {
      await queryRunner.addColumn(
        'recipes',
        new TableColumn({
          name: 'level',
          type: 'varchar',
          length: '6',
          comment: '조리 난이도',
          isNullable: false,
        }),
      );
    }

    // method 컬럼 추가 (존재하지 않을 때만)
    const existsMethod = await queryRunner.hasColumn('recipes', 'method');
    if (!existsMethod) {
      await queryRunner.addColumn(
        'recipes',
        new TableColumn({
          name: 'method',
          type: 'varchar',
          length: '6',
          comment: '조리 방식',
          isNullable: false,
        }),
      );
    }
  }

  async down(queryRunner) {
    // method 컬럼 제거 (존재 시)
    const existsMethod = await queryRunner.hasColumn('recipes', 'method');
    if (existsMethod) {
      await queryRunner.dropColumn('recipes', 'method');
    }

    // level 컬럼 제거 (존재 시)
    const existsLevel = await queryRunner.hasColumn('recipes', 'level');
    if (existsLevel) {
      await queryRunner.dropColumn('recipes', 'level');
    }
  }
};
