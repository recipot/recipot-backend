import { QueryRunner, TableColumn } from 'typeorm';

module.exports = class Migration20250125000000 {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user_completed_recipes',
      new TableColumn({
        name: 'review_count',
        type: 'int',
        default: 0,
        isNullable: false,
        comment: '후기 작성 횟수',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user_completed_recipes', 'review_count');
  }
};
