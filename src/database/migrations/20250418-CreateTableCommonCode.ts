import { Table, TableForeignKey } from 'typeorm';

module.exports = class Migration20250418141538 {
  async up(queryRunner) {
    await queryRunner.createTable(
      new Table({
        name: 'common_code_group',
        columns: [
          { name: 'group_code', type: 'varchar', length: '3', isPrimary: true },
          { name: 'group_name', type: 'varchar', length: '30' },
          { name: 'remark', type: 'varchar', length: '100', isNullable: true },
          { name: 'use_yn', type: 'char', length: '1', default: "'Y'" },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '20',
            default: "'SYSTEM'",
          },
          {
            name: 'updated_by',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
        ],
      }),
    );

    // 공통 코드 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: 'common_code',
        columns: [
          { name: 'code', type: 'varchar', length: '6', isPrimary: true },
          { name: 'group_code', type: 'varchar', length: '3' },
          { name: 'name', type: 'varchar', length: '20' },
          { name: 'remark', type: 'varchar', length: '100', isNullable: true },
          { name: 'sort_order', type: 'int' },
          { name: 'use_yn', type: 'char', length: '1', default: "'Y'" },
          { name: 'depth', type: 'int', default: 1 },
          {
            name: 'parent_code',
            type: 'varchar',
            length: '6',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '20',
            default: "'SYSTEM'",
          },
          {
            name: 'updated_by',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['group_code'],
            referencedTableName: 'common_code_group',
            referencedColumnNames: ['group_code'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );
  }

  async down(queryRunner) {
    await queryRunner.dropTable('common_code');
    await queryRunner.dropTable('common_code_group');
  }
};
