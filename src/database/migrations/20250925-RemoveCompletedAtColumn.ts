import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveCompletedAtColumn1705123456789
  implements MigrationInterface
{
  name = 'RemoveCompletedAtColumn1705123456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // completed_at 컬럼 제거
    await queryRunner.dropColumn('user_completed_recipes', 'completed_at');

    // CommonEntity 필드들 추가
    await queryRunner.addColumn(
      'user_completed_recipes',
      new TableColumn({
        name: 'created_at',
        type: 'datetime',
        default: 'CURRENT_TIMESTAMP',
        comment: '생성일시',
      }),
    );

    await queryRunner.addColumn(
      'user_completed_recipes',
      new TableColumn({
        name: 'updated_at',
        type: 'datetime',
        default: 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
        comment: '수정일시',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // CommonEntity 필드들 제거
    await queryRunner.dropColumn('user_completed_recipes', 'updated_at');
    await queryRunner.dropColumn('user_completed_recipes', 'created_at');

    // completed_at 컬럼 복원
    await queryRunner.addColumn(
      'user_completed_recipes',
      new TableColumn({
        name: 'completed_at',
        type: 'datetime',
        isNullable: true,
        comment: '완료 날짜',
      }),
    );
  }
}
