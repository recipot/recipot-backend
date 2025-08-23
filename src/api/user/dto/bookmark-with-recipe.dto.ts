import { ApiProperty } from '@nestjs/swagger';

export class BookmarkWithRecipeDto {
  @ApiProperty({ description: '북마크 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '사용자 ID', example: 1 })
  user_id: number;

  @ApiProperty({ description: '레시피 ID', example: 1 })
  recipe_id: number;

  @ApiProperty({ description: '레시피 설명', example: '맛있는 파스타 만들기' })
  recipe_description: string;

  @ApiProperty({ description: '소요 시간', example: '30분' })
  recipe_duration: string;

  @ApiProperty({ description: '조리 난이도', example: '중급' })
  recipe_level: string;

  @ApiProperty({ description: '조리 방식', example: '볶기' })
  recipe_method: string;

  @ApiProperty({ description: '설거지 난이도', example: '쉬움' })
  recipe_washing_level: string;

  @ApiProperty({
    description: '레시피 이미지 URL 목록',
    example: ['https://example.com/image1.jpg'],
  })
  recipe_images: string[];

  @ApiProperty({
    description: '북마크 생성일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  created_at: Date;
}
