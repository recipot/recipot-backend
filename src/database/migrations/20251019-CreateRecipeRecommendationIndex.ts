module.exports = class Migration20251019170136 {
  async up(queryRunner) {
    await queryRunner.query(`
      ALTER TABLE recipot.user_recipe_recommendation
      ADD INDEX idx_user_recipe_recommendation_condition_recipe (condition_id, recipe_id)
    `);
  }

  async down(queryRunner) {
    await queryRunner.query(`
      ALTER TABLE recipot.user_recipe_recommendation
      DROP INDEX idx_user_recipe_recommendation_condition_recipe
    `);
  }
};
