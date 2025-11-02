import { QueryRunner, TableColumn } from 'typeorm';

module.exports = class Migration20251102000004 {
  async up(queryRunner: QueryRunner) {
    // recipes 테이블의 level 컬럼 삭제
    const table = await queryRunner.getTable('recipes');
    if (table) {
      const levelColumn = table.findColumnByName('level');
      if (levelColumn) {
        await queryRunner.dropColumn('recipes', 'level');
      }
    }
  }

  async down(queryRunner: QueryRunner) {
    // level 컬럼을 다시 추가 (마이그레이션 롤백 시)
    await queryRunner.addColumn(
      'recipes',
      new TableColumn({
        name: 'level',
        type: 'varchar',
        length: '6',
        isNullable: false,
        comment: '조리 난이도',
      }),
    );
  }
};
