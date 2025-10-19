import { ApiProperty } from '@nestjs/swagger';
import { RecentRecipeWithRecipeDto } from './recent-recipe-with-recipe.dto';

export class GetRecentRecipesResponseDto {
  @ApiProperty({
    description: '최근 본 레시피 목록',
    type: [RecentRecipeWithRecipeDto],
  })
  items: RecentRecipeWithRecipeDto[];

  @ApiProperty({ description: '전체 항목 수', example: 25 })
  total: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지 당 항목 수', example: 10 })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수', example: 3 })
  totalPages: number;
}
