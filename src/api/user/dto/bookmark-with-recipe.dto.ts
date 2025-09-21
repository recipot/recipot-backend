import { ApiProperty } from '@nestjs/swagger';

export class BookmarkWithRecipeDto {
  @ApiProperty({ description: '북마크 ID', example: 1 })
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
    description: '북마크 생성일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;
}
