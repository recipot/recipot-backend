import { QueryRunner, TableColumn } from 'typeorm';

module.exports = class Migration20251024214154 {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'level',
        type: 'int',
        default: 1,
        isNullable: false,
        comment: '사용자 레벨 (0~2: L1, 3~6: L2, 7~15: L3, 16+: L4)',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'level');
  }
};
