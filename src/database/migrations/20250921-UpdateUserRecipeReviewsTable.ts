import { TableColumn } from 'typeorm';

module.exports = class Migration20250921213743 {
  async up(queryRunner) {
    // 기존 user_recipe_reviews 테이블에 컬럼 추가
    await queryRunner.addColumns('user_recipe_reviews', [
      new TableColumn({
        name: 'taste_code',
        type: 'varchar',
        length: '6',
        isNullable: true,
        comment: '맛 평가 코드',
      }),
      new TableColumn({
        name: 'difficulty_code',
        type: 'varchar',
        length: '6',
        isNullable: true,
        comment: '요리 시작 난이도 코드',
      }),
      new TableColumn({
        name: 'experience_code',
        type: 'varchar',
        length: '6',
        isNullable: true,
        comment: '요리 경험 코드',
      }),
      new TableColumn({
        name: 'content',
        type: 'text',
        isNullable: true,
        comment: '리뷰 내용',
      }),
    ]);
  }

  async down(queryRunner) {
    await queryRunner.dropColumns('user_recipe_reviews', [
      'taste_code',
      'difficulty_code',
      'experience_code',
      'content',
    ]);
  }
};
