module.exports = class Migration20250824000231 {
  async up(queryRunner) {
    // recipes 테이블에 title 컬럼 추가
    await queryRunner.query(`
      ALTER TABLE recipes 
      ADD COLUMN title VARCHAR(255) COMMENT '타이틀' AFTER id
    `);
  }

  async down(queryRunner) {
    // title 컬럼 제거
    await queryRunner.query(`
      ALTER TABLE recipes 
      DROP COLUMN title
    `);
  }
};
