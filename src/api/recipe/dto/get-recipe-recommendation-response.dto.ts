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
    description: '레시피 이미지 URL 목록',
    example: [
      'https://example.com/recipe1.jpg',
      'https://example.com/recipe2.jpg',
    ],
    required: false,
    type: [String],
  })
  imageUrls?: string[];

  @ApiProperty({
    description: '조리 시간',
    example: '30분',
    required: false,
  })
  duration?: string;

  @ApiProperty({
    description: '조리 도구 목록',
    example: ['프라이팬', '냄비'],
    required: false,
    type: [String],
  })
  tools?: string[];

  @ApiProperty({
    description: '북마크 여부',
    example: true,
    required: false,
  })
  isBookmarked?: boolean;
}

export class GetRecipeRecommendationResponseDto {
  @ApiProperty({
    description: '추천 레시피 목록 (페이지당 3개)',
    type: [RecipeRecommendationItemDto],
  })
  items: RecipeRecommendationItemDto[];

  @ApiProperty({
    description: '현재 페이지 번호',
    example: 1,
  })
  currentPage: number;

  @ApiProperty({
    description: '페이지당 아이템 수',
    example: 3,
  })
  pageSize: number;

  @ApiProperty({
    description: '전체 아이템 수',
    example: 15,
  })
  totalItems: number;

  @ApiProperty({
    description: '전체 페이지 수',
    example: 5,
  })
  totalPages: number;

  @ApiProperty({
    description: '다음 페이지 존재 여부',
    example: true,
  })
  hasNextPage: boolean;
}
