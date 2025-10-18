import { Table } from 'typeorm';

module.exports = class Migration20251018000000 {
  async up(queryRunner) {
    await queryRunner.createTable(
      new Table({
        name: 'measurement_guides',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: '계량 가이드 PK',
          },
          {
            name: 'category_code',
            type: 'varchar',
            length: '6',
            isNullable: false,
            comment: '계량 카테고리 코드 (CommonCode M01001, M01002 등)',
          },
          {
            name: 'standard',
            type: 'varchar',
            isNullable: false,
            comment: '계량 기준 (예: 큰술, 작은술, 컵, 그램 등)',
          },
          {
            name: 'image_url',
            type: 'varchar',
            isNullable: true,
            comment: '계량 이미지 URL (S3)',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
            comment: '계량 설명 (예: "밥숟가락 기준으로 계량합니다")',
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            comment: '생성일시',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            comment: '수정일시',
          },
          {
            name: 'deleted_at',
            type: 'datetime',
            isNullable: true,
            comment: '삭제일시 (소프트 딜리트)',
          },
        ],
        comment: '계량 가이드 테이블',
      }),
    );
  }

  async down(queryRunner) {
    await queryRunner.dropTable('measurement_guides');
  }
};
