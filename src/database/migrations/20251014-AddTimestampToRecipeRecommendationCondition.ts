import { TableColumn } from 'typeorm';

module.exports = class Migration20251014062946 {
  async up(queryRunner) {
    await queryRunner.addColumns('recipe_recommendation_condition', [
      new TableColumn({
        name: 'created_at',
        type: 'datetime',
        default: 'CURRENT_TIMESTAMP',
        comment: '생성일시',
      }),
      new TableColumn({
        name: 'updated_at',
        type: 'datetime',
        default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        comment: '수정일시',
      }),
    ]);
  }

  async down(queryRunner) {
    await queryRunner.dropColumns('recipe_recommendation_condition', [
      'created_at',
      'updated_at',
    ]);
  }
};
