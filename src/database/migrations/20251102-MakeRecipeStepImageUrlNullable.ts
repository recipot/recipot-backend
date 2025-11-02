import { QueryRunner, TableColumn } from 'typeorm';

module.exports = class Migration20251102000003 {
  async up(queryRunner: QueryRunner) {
    // recipe_steps 테이블의 image_url 컬럼을 nullable로 변경
    await queryRunner.changeColumn(
      'recipe_steps',
      'image_url',
      new TableColumn({
        name: 'image_url',
        type: 'varchar',
        isNullable: true,
        comment: '요리 예시 이미지 주소',
      }),
    );
  }

  async down(queryRunner: QueryRunner) {
    // image_url 컬럼을 다시 not null로 변경
    await queryRunner.changeColumn(
      'recipe_steps',
      'image_url',
      new TableColumn({
        name: 'image_url',
        type: 'varchar',
        isNullable: false,
        comment: '요리 예시 이미지 주소',
      }),
    );
  }
};
