import { QueryRunner } from 'typeorm';

module.exports = class Migration20250126000000 {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // is_reviewed 컬럼 제거 (reviewCount로 대체됨)
    await queryRunner.dropColumn('user_completed_recipes', 'is_reviewed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 롤백 시 컬럼 복구 (기본값 false)
    await queryRunner.query(`
      ALTER TABLE user_completed_recipes
      ADD COLUMN is_reviewed BOOLEAN NOT NULL DEFAULT FALSE COMMENT '후기 작성 여부 (Deprecated: reviewCount 사용 권장)'
    `);

    // 기존 데이터 동기화: review_count > 0이면 is_reviewed = true
    await queryRunner.query(`
      UPDATE user_completed_recipes
      SET is_reviewed = TRUE
      WHERE review_count > 0
    `);
  }
};
