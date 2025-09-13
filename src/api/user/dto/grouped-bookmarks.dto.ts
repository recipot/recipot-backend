import { ApiProperty } from '@nestjs/swagger';
import { BookmarkWithRecipeDto } from './bookmark-with-recipe.dto';

export class GroupedBookmarksDto {
  @ApiProperty({ description: '날짜', example: '2024-01-01' })
  date: string;

  @ApiProperty({
    description: '해당 날짜의 북마크 목록',
    type: [BookmarkWithRecipeDto],
  })
  bookmarks: BookmarkWithRecipeDto[];
}
