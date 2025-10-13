import { ApiProperty } from '@nestjs/swagger';

export class RecipeRecommendationItemDto {
  @ApiProperty({
    description: '레시피 ID',
    example: 1,
  })
  recipeId: number;

  @ApiProperty({
    description: '레시피 제목',
    example: '간장 고등어 구이',
  })
  title: string;

  @ApiProperty({
    description: '레시피 설명',
    example: '고소하고 짭짤한 간장 고등어 구이입니다.',
  })
  description: string;

  @ApiProperty({
    description: '레시피 이미지 URL',
    example: 'https://example.com/recipe.jpg',
    required: false,
  })
  imageUrl?: string;
}

export class GetRecipeRecommendationResponseDto {
  @ApiProperty({
    description: '추천 레시피 목록 (상위 3개)',
    type: [RecipeRecommendationItemDto],
  })
  items: RecipeRecommendationItemDto[];

  @ApiProperty({
    description: '캐시에서 가져온 데이터인지 여부',
    example: true,
  })
  fromCache: boolean;

  @ApiProperty({
    description: '계산된 시간 (Unix timestamp)',
    example: 1704067200000,
  })
  computedAt: number;

  @ApiProperty({
    description: '캐시 TTL (초)',
    example: 3600,
  })
  ttlSec: number;
}
