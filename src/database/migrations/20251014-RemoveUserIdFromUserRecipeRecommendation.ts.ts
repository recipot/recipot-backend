import { QueryRunner } from 'typeorm';

module.exports = class Migration20251014073206 {
  async up(queryRunner: QueryRunner) {
    // user_id 컬럼 제거
    await queryRunner.dropColumn('user_recipe_recommendation', 'user_id');
  }

  async down(queryRunner: QueryRunner) {
    // 롤백: user_id 컬럼 다시 추가
    await queryRunner.query(`
      ALTER TABLE user_recipe_recommendation 
      ADD COLUMN user_id BIGINT NOT NULL COMMENT '유저 PK'
    `);
  }
};
