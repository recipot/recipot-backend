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
    // NOT NULL로 변경하기 전에 NULL 값을 기본값으로 처리
    // NULL 레코드가 있으면 NOT NULL 제약 조건 위반으로 롤백이 실패할 수 있음
    await queryRunner.query(
      "UPDATE recipe_steps SET image_url = '' WHERE image_url IS NULL;",
    );

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
