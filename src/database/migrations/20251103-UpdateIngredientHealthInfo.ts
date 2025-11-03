import { QueryRunner, TableColumn } from 'typeorm';

module.exports = class Migration20251103190105 {
  async up(queryRunner: QueryRunner) {
    await queryRunner.changeColumn(
      'ingredient_health_infos',
      'content',
      new TableColumn({
        name: 'content',
        type: 'text',
        isNullable: true,
        comment: '건강 정보 내용',
      }),
    );
  }

  async down(queryRunner: QueryRunner) {
    // 롤백: NULL 값이 있으면 빈 문자열로 변경 후 NOT NULL로 복원
    await queryRunner.query(
      "UPDATE ingredient_health_infos SET content = '' WHERE content IS NULL;",
    );

    // content 컬럼을 다시 NOT NULL로 변경
    await queryRunner.changeColumn(
      'ingredient_health_infos',
      'content',
      new TableColumn({
        name: 'content',
        type: 'text',
        isNullable: false,
        comment: '건강 정보 내용',
      }),
    );
  }
};
