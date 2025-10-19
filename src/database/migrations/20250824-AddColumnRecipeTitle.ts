module.exports = class Migration20250824000231 {
  async up(queryRunner) {
    // title 컬럼이 존재하는지 확인
    const table = await queryRunner.getTable('recipes');
    const titleColumn = table?.findColumnByName('title');

    // title 컬럼이 없는 경우에만 추가
    if (!titleColumn) {
      await queryRunner.query(`
        ALTER TABLE recipes 
        ADD COLUMN title VARCHAR(255) COMMENT '타이틀' AFTER id
      `);
    }
  }

  async down(queryRunner) {
    // title 컬럼이 존재하는지 확인 후 제거
    const table = await queryRunner.getTable('recipes');
    const titleColumn = table?.findColumnByName('title');

    if (titleColumn) {
      await queryRunner.query(`
        ALTER TABLE recipes 
        DROP COLUMN title
      `);
    }
  }
};
