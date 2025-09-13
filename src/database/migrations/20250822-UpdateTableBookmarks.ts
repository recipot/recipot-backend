import { TableColumn } from 'typeorm';

module.exports = class Migration20250822051705 {
  async up(queryRunner) {
    // user_recipe_bookmarks 테이블에 created_at 컬럼 추가
    await queryRunner.addColumn(
      'user_recipe_bookmarks',
      new TableColumn({
        name: 'created_at',
        type: 'datetime',
        default: 'CURRENT_TIMESTAMP',
      }),
    );
  }

  async down(queryRunner) {
    // created_at 컬럼 제거
    await queryRunner.dropColumn('user_recipe_bookmarks', 'created_at');
  }
};
