import { ApiProperty } from '@nestjs/swagger';

export class CompletedRecipeWithRecipeDto {
  @ApiProperty({ description: '완료한 레시피 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '레시피 ID', example: 1 })
  recipeId: number;

  @ApiProperty({ description: '레시피 제목', example: '크림 파스타' })
  recipeTitle: string;

  @ApiProperty({ description: '레시피 설명', example: '맛있는 파스타 만들기' })
  recipeDescription: string;

  @ApiProperty({
    description: '레시피 이미지 URL 목록',
    example: ['https://example.com/image1.jpg'],
  })
  recipeImages: string[];

  @ApiProperty({
    description: '완료 여부',
    example: true,
  })
  isCompleted: boolean;

  @ApiProperty({
    description: '후기 작성 여부 (Deprecated: reviewCount > 0으로 확인 가능)',
    example: false,
    deprecated: true,
  })
  isReviewed: boolean;

  @ApiProperty({
    description: '완료한 레시피 생성일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '북마크 여부',
    example: true,
  })
  isBookmarked: boolean;
}
