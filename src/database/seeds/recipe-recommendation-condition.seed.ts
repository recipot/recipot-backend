import { RecipeRecommendationCondition } from '@/database/entity/recipe-recommendation-condition.entity';
import { DataSource } from 'typeorm';

export async function seedRecipeRecommendationCondition(
  dataSource: DataSource,
): Promise<void> {
  const repository = dataSource.getRepository(RecipeRecommendationCondition);

  // 기존 데이터 삭제
  await repository.clear();

  const recipeRecommendationConditions = [
    // 레시피 1 (돼지고기 김치찌개) - 컨디션별 가중치
    {
      recipeId: 1,
      conditionId: 1, // 힘들어
      priorityScore: 0.8,
    },
    {
      recipeId: 1,
      conditionId: 2, // 그럭저럭
      priorityScore: 0.7,
    },
    {
      recipeId: 1,
      conditionId: 3, // 충분해
      priorityScore: 1.0,
    },

    // 레시피 2 (차돌박이 된장찌개) - 컨디션별 가중치
    {
      recipeId: 2,
      conditionId: 1, // 힘들어
      priorityScore: 0.6,
    },
    {
      recipeId: 2,
      conditionId: 2, // 그럭저럭
      priorityScore: 0.7,
    },
    {
      recipeId: 2,
      conditionId: 3, // 충분해
      priorityScore: 1.0,
    },

    // 레시피 3 (에어프라이어 고등어 구이) - 컨디션별 가중치
    {
      recipeId: 3,
      conditionId: 1, // 힘들어
      priorityScore: 0.7,
    },
    {
      recipeId: 3,
      conditionId: 2, // 그럭저럭
      priorityScore: 1.0,
    },
    {
      recipeId: 3,
      conditionId: 3, // 충분해
      priorityScore: 0.9,
    },

    // 레시피 4 (클래식 김치볶음밥) - 컨디션별 가중치
    {
      recipeId: 4,
      conditionId: 1, // 힘들어
      priorityScore: 0.5,
    },
    {
      recipeId: 4,
      conditionId: 2, // 그럭저럭
      priorityScore: 0.8,
    },
    {
      recipeId: 4,
      conditionId: 3, // 충분해
      priorityScore: 0.9,
    },

    // 레시피 5 (바삭한 감자전) - 컨디션별 가중치
    {
      recipeId: 5,
      conditionId: 1, // 힘들어
      priorityScore: 0.4,
    },
    {
      recipeId: 5,
      conditionId: 2, // 그럭저럭
      priorityScore: 0.6,
    },
    {
      recipeId: 5,
      conditionId: 3, // 충분해
      priorityScore: 0.7,
    },

    // 레시피 6 (초간단 참치마요 덮밥) - 컨디션별 가중치
    {
      recipeId: 6,
      conditionId: 1, // 힘들어
      priorityScore: 0.7,
    },
    {
      recipeId: 6,
      conditionId: 2, // 그럭저럭
      priorityScore: 0.9,
    },
    {
      recipeId: 6,
      conditionId: 3, // 충분해
      priorityScore: 0.8,
    },

    // 레시피 7 (학교 앞 추억의 떡볶이) - 컨디션별 가중치
    {
      recipeId: 7,
      conditionId: 1, // 힘들어
      priorityScore: 0.3,
    },
    {
      recipeId: 7,
      conditionId: 2, // 그럭저럭
      priorityScore: 0.5,
    },
    {
      recipeId: 7,
      conditionId: 3, // 충분해
      priorityScore: 0.6,
    },

    // 레시피 8 (시원한 어묵탕) - 컨디션별 가중치
    {
      recipeId: 8,
      conditionId: 1, // 힘들어
      priorityScore: 0.6,
    },
    {
      recipeId: 8,
      conditionId: 2, // 그럭저럭
      priorityScore: 0.7,
    },
    {
      recipeId: 8,
      conditionId: 3, // 충분해
      priorityScore: 0.8,
    },

    // 레시피 9 (기본 토마토 스파게티) - 컨디션별 가중치
    {
      recipeId: 9,
      conditionId: 1, // 힘들어
      priorityScore: 0.6,
    },
    {
      recipeId: 9,
      conditionId: 2, // 그럭저럭
      priorityScore: 0.7,
    },
    {
      recipeId: 9,
      conditionId: 3, // 충분해
      priorityScore: 0.8,
    },

    // 레시피 10 (알리오 올리오 파스타) - 컨디션별 가중치
    {
      recipeId: 10,
      conditionId: 1, // 힘들어
      priorityScore: 0.6,
    },
    {
      recipeId: 10,
      conditionId: 2, // 그럭저럭
      priorityScore: 0.7,
    },
    {
      recipeId: 10,
      conditionId: 3, // 충분해
      priorityScore: 0.8,
    },
  ];

  // 데이터 삽입
  for (const conditionData of recipeRecommendationConditions) {
    const condition = repository.create(conditionData);
    await repository.save(condition);
  }

  console.log('RecipeRecommendationCondition 시드 데이터 생성 완료');
}
