import { ApiProperty } from '@nestjs/swagger';
import { BookmarkWithRecipeDto } from './bookmark-with-recipe.dto';

export class GetBookmarksResponseDto {
  @ApiProperty({
    description: '북마크 목록',
    type: [BookmarkWithRecipeDto],
  })
  items: BookmarkWithRecipeDto[];

  @ApiProperty({
    description: '전체 항목 수',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: '현재 페이지',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지 당 항목 수',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: '전체 페이지 수',
    example: 3,
  })
  totalPages: number;
}
