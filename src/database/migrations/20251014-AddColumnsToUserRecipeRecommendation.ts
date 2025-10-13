import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class Migration20251014072643 implements MigrationInterface {
  async up(queryRunner: QueryRunner) {
    await queryRunner.addColumns('user_recipe_recommendation', [
      new TableColumn({
        name: 'ingredient_fulfillment_rate',
        type: 'float',
        default: 0.0,
        comment: '재료 충족률 (0.0 ~ 1.0)',
      }),
      new TableColumn({
        name: 'missing_ingredient_count',
        type: 'int',
        default: 0,
        comment: '부족한 재료 개수',
      }),
      new TableColumn({
        name: 'redis_hash_key',
        type: 'varchar',
        length: '255',
        comment: 'Redis 캐시 해시키',
        isNullable: true,
      }),
    ]);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.dropColumns('user_recipe_recommendation', [
      'ingredient_fulfillment_rate',
      'missing_ingredient_count',
      'redis_hash_key',
    ]);
  }
}
