const { Table } = require('typeorm');

module.exports = class Migration20250803144638 {
  async up(queryRunner) {
    await queryRunner.createTable(
      new Table({
        name: 'common_codes',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: '공통 코드 PK',
          },
          {
            name: 'group_code',
            type: 'varchar',
            length: '3',
            isNullable: false,
            comment: '그룹 코드',
          },
          {
            name: 'group_code_name',
            type: 'varchar',
            isNullable: false,
            comment: '그룹 코드명',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '6',
            isNullable: false,
            comment: '코드',
          },
          {
            name: 'code_name',
            type: 'varchar',
            isNullable: false,
            comment: '코드명',
          },
          {
            name: 'group_name',
            type: 'varchar',
            isNullable: false,
            comment: '그룹명',
          },
          {
            name: 'order_num',
            type: 'int',
            isNullable: false,
            comment: '정렬 순서',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment: '사용 여부',
          },
          {
            name: 'depth',
            type: 'int',
            isNullable: false,
            comment: '코드 깊이',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'datetime',
            isNullable: true,
            comment: '삭제일시',
          },
        ],
        comment: '공통 코드 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: '유저 PK',
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: false,
            comment: '이메일',
          },
          {
            name: 'profile_image_url',
            type: 'varchar',
            isNullable: true,
            comment: '프로필 이미지 주소',
          },
          {
            name: 'nickname',
            type: 'varchar',
            isNullable: false,
            comment: '닉네임',
          },
          {
            name: 'recipe_complete_count',
            type: 'int',
            isNullable: false,
            default: 0,
            comment: '레시피 완료 횟수',
          },
          {
            name: 'is_first_entry',
            type: 'boolean',
            isNullable: false,
            default: false,
            comment: '최초 진입 여부',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'datetime',
            isNullable: true,
            comment: '삭제일시',
          },
        ],
        comment: '유저 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'social_logins',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: '소셜 로그인 PK',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
            comment: '유저 PK',
          },
          {
            name: 'sid',
            type: 'varchar',
            isNullable: false,
            comment: '소셜 플랫폼 식별자',
          },
          {
            name: 'platform',
            type: 'varchar',
            length: '6',
            isNullable: false,
            comment: '플랫폼 구분 (kakao, google 등)',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'datetime',
            isNullable: true,
            comment: '삭제일시',
          },
        ],
        comment: '소셜 로그인 정보 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'ingredient_categories',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: '재료 카테고리 PK',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
            comment: '카테고리 이름 (해산물류, 육류 등)',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'datetime',
            isNullable: true,
            comment: '삭제일시',
          },
        ],
        comment: '재료 카테고리 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'ingredients',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: '재료 PK',
          },
          {
            name: 'ingredient_categorie_id',
            type: 'int',
            isNullable: false,
            comment: '재료 카테고리 PK',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
            comment: '재료 이름 (예: 고등어, 게 등)',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'datetime',
            isNullable: true,
            comment: '삭제일시',
          },
        ],
        comment: '재료 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'ingredient_health_infos',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: '건강 정보 PK',
          },
          {
            name: 'ingredient_id',
            type: 'int',
            isNullable: false,
            comment: '재료 PK',
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
            comment: '건강 정보 내용',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'datetime',
            isNullable: true,
            comment: '삭제일시',
          },
        ],
        comment: '재료별 건강 정보 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'user_unavailable_ingredients',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'PK',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
            comment: '유저 PK',
          },
          {
            name: 'ingredient_id',
            type: 'int',
            isNullable: false,
            comment: '재료 PK',
          },
        ],
        comment: '못 먹는 재료 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'recipes',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: '레시피 PK',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
            comment: '설명',
          },
          {
            name: 'duration',
            type: 'varchar',
            length: '6',
            isNullable: false,
            comment: '소요 시간',
          },
          {
            name: 'level',
            type: 'varchar',
            length: '6',
            isNullable: false,
            comment: '조리 난이도',
          },
          {
            name: 'method',
            type: 'varchar',
            method: '6',
            isNullable: false,
            comment: '조리 방식',
          },
          {
            name: 'washing_level',
            type: 'varchar',
            method: '6',
            isNullable: false,
            comment: '설거지 난이도',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'datetime',
            isNullable: true,
            comment: '삭제일시',
          },
        ],
        comment: '레시피 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'recipe_images',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'PK',
          },
          {
            name: 'recipe_id',
            type: 'int',
            isNullable: false,
            comment: '레시피 PK',
          },
          {
            name: 'image_url',
            type: 'varchar',
            isNullable: false,
            comment: '레시피 이미지 주소',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'datetime',
            isNullable: true,
            comment: '삭제일시',
          },
        ],
        comment: '레시피 이미지 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'recipe_ingredients',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'PK',
          },
          {
            name: 'recipe_id',
            type: 'int',
            isNullable: false,
            comment: '레시피 PK',
          },
          {
            name: 'ingredient_id',
            type: 'int',
            isNullable: false,
            comment: '재료 PK',
          },
          {
            name: 'is_alternative',
            type: 'boolean',
            isNullable: false,
            default: false,
            comment: '대체 가능 여부',
          },
          {
            name: 'amount',
            type: 'varchar',
            isNullable: false,
            comment: '개수 또는 양',
          },
        ],
        comment: '레시피 재료 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'seasonings',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: '양념 PK',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
            comment: '양념 이름',
          },
          {
            name: 'image_url',
            type: 'varchar',
            isNullable: false,
            comment: '양념 이미지 주소',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'datetime',
            isNullable: true,
            comment: '삭제일시',
          },
        ],
        comment: '양념 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'tools',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: '조리 도구 PK',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
            comment: '도구 이름',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'datetime',
            isNullable: true,
            comment: '삭제일시',
          },
        ],
        comment: '조리 도구 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'recipe_seasonings',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'PK',
          },
          {
            name: 'recipe_id',
            type: 'int',
            isNullable: false,
            comment: '레시피 PK',
          },
          {
            name: 'tool_id',
            type: 'int',
            isNullable: false,
            comment: '양념 PK',
          },
        ],
        comment: '레시피 양념 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'recipe_tools',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'PK',
          },
          {
            name: 'recipe_id',
            type: 'int',
            isNullable: false,
            comment: '레시피 PK',
          },
          {
            name: 'tool_id',
            type: 'int',
            isNullable: false,
            comment: '도구 PK',
          },
        ],
        comment: '레시피 조리 도구 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'recipe_steps',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'PK',
          },
          {
            name: 'recipe_id',
            type: 'int',
            isNullable: false,
            comment: '레시피 PK',
          },
          {
            name: 'order_num',
            type: 'int',
            isNullable: false,
            comment: '순서',
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
            comment: '내용',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'datetime',
            isNullable: true,
            comment: '삭제일시',
          },
        ],
        comment: '레시피 요리 순서 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'user_completed_recipes',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'PK',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
            comment: '유저 PK',
          },
          {
            name: 'recipe_id',
            type: 'int',
            isNullable: false,
            comment: '레시피 PK',
          },
          {
            name: 'is_completed',
            type: 'boolean',
            isNullable: false,
            default: false,
            comment: '완료 여부',
          },
          {
            name: 'completed_at',
            type: 'datetime',
            isNullable: true,
            comment: '완료 날짜',
          },
          {
            name: 'is_reviewed',
            type: 'boolean',
            isNullable: false,
            default: false,
            comment: '후기 작성 여부',
          },
        ],
        comment: '유저 완료 레시피 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'user_recipe_reviews',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'PK',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
            comment: '유저 PK',
          },
          {
            name: 'recipe_id',
            type: 'int',
            isNullable: false,
            comment: '레시피 PK',
          },
          {
            name: 'satisfaction',
            type: 'varchar',
            length: '6',
            isNullable: false,
            comment: '만족도',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'datetime',
            isNullable: true,
            comment: '삭제일시',
          },
        ],
        comment: '유저 완료 레시피 후기 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'user_recipe_review_feedbacks',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'PK',
          },
          {
            name: 'user_recipe_review_id',
            type: 'int',
            isNullable: false,
            comment: '유저 레시피 후기 PK',
          },
          {
            name: 'feedback',
            type: 'varchar',
            length: '6',
            isNullable: false,
            comment: '만족도 피드백',
          },
        ],
        comment: '유저 레시피 후기 상세 피드백 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'user_recipe_bookmarks',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'PK',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
            comment: '유저 PK',
          },
          {
            name: 'recipe_id',
            type: 'int',
            isNullable: false,
            comment: '레시피 PK',
          },
        ],
        comment: '유저 레시피 북마크 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'conditions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'PK',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
            comment: '컨디션 이름',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'datetime',
            isNullable: true,
            comment: '삭제일시',
          },
        ],
        comment: '컨디션 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'recipe_recommendation_condition',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'PK',
          },
          {
            name: 'recipe_id',
            type: 'int',
            isNullable: false,
            comment: '레시피 PK',
          },
          {
            name: 'condition_id',
            type: 'int',
            isNullable: false,
            comment: '컨디션 PK',
          },
          {
            name: 'priority_score',
            type: 'float',
            isNullable: false,
            default: 1.0,
            comment: '가중치 (높을수록 더 적합)',
          },
        ],
        comment: '컨디션별 레시피 적합도 테이블',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'user_recipe_recommendation',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'PK',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
            comment: '유저 PK',
          },
          {
            name: 'recipe_id',
            type: 'int',
            isNullable: false,
            comment: '레시피 PK',
          },
          {
            name: 'condition_id',
            type: 'int',
            isNullable: false,
            comment: '컨디션 PK',
          },
          {
            name: 'based_on',
            type: 'varchar',
            length: '6',
            isNullable: false,
            comment: '추천 기준',
          },
          {
            name: 'score',
            type: 'float',
            default: 1.0,
            isNullable: false,
            comment: '종합 점수 (가중치 * 충족률 등)',
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'datetime',
            isNullable: true,
            comment: '삭제일시',
          },
        ],
        comment: '유저별 추천 레시피 결과 테이블',
      }),
    );
  }

  async down(queryRunner) {
    await queryRunner.dropTable('common_codes');
    await queryRunner.dropTable('users');
    await queryRunner.dropTable('user_unavailable_ingredients');
    await queryRunner.dropTable('ingredient_health_infos');
    await queryRunner.dropTable('ingredients');
    await queryRunner.dropTable('ingredient_categories');
    await queryRunner.dropTable('recipe_steps');
    await queryRunner.dropTable('recipe_tools');
    await queryRunner.dropTable('recipe_seasonings');
    await queryRunner.dropTable('tools');
    await queryRunner.dropTable('seasonings');
    await queryRunner.dropTable('recipe_ingredients');
    await queryRunner.dropTable('recipe_images');
    await queryRunner.dropTable('recipes');
    await queryRunner.dropTable('user_recipe_bookmarks');
    await queryRunner.dropTable('user_recipe_review_feedbacks');
    await queryRunner.dropTable('user_recipe_reviews');
    await queryRunner.dropTable('user_completed_recipes');
    await queryRunner.dropTable('user_recipe_recommendation');
    await queryRunner.dropTable('recipe_recommendation_condition');
    await queryRunner.dropTable('conditions');
  }
};
