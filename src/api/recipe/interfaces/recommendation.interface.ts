import { RecipeRecommendationItemDto } from '../dto/get-recipe-recommendation-response.dto';

/**
 * 캐시된 추천 결과
 */
export interface CachedRecommendation {
  items: RecipeRecommendationItemDto[];
  totalItems: number;
  computedAt: number;
  ttlSec: number;
}

/**
 * 레시피 점수 정보
 */
export interface RecipeScore {
  recipeId: number;
  title: string;
  description: string;
  score: number;
  ingredientFulfillmentRate: number;
  priorityScore: number;
  missingIngredientIds: number[];
  imageUrls?: string[];
  duration?: string;
  tools?: string[];
  isBookmarked?: boolean;
}

/**
 * 추천 재계산 파라미터
 */
export interface RecomputeParams {
  conditionId: number;
  pantryIds: number[];
  unavailableIds: number[];
  persist?: boolean;
  userId?: number;
}

/**
 * 페이지네이션 결과
 */
export interface PaginationResult {
  items: RecipeRecommendationItemDto[];
  allItems: RecipeRecommendationItemDto[];
  totalItems: number;
}
