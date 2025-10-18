import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class MyPageRecipeCardDto {
  @ApiProperty({ example: 1 }) id: number;
  @ApiProperty({ example: '간장 고등어 구이' }) title: string;
  @ApiProperty({ example: 'https://example.com/recipe.jpg', nullable: true })
  imageUrl?: string | null;
}

export class MyPageIngredientDto {
  @ApiProperty({ example: 1 }) id: number;
  @ApiProperty({ example: '고등어' }) name: string;
  @ApiProperty({ example: '해산물류', nullable: true })
  categoryName?: string | null;
}

export class MyPageStatsDto {
  @ApiProperty({ example: 12 }) savedCount: number;
  @ApiProperty({ example: 5 }) recentCount: number;
  @ApiProperty({ example: 8 }) cookedCount: number;
  @ApiProperty({ example: 3 }) unavailableCount: number;
}

export class MyPageSummaryDto {
  @ApiProperty({ type: UserDto }) profile: UserDto;
  @ApiProperty({ type: MyPageStatsDto }) stats: MyPageStatsDto;
  @ApiProperty({ type: [MyPageRecipeCardDto] })
  savedRecipes: MyPageRecipeCardDto[];
  @ApiProperty({ type: [MyPageRecipeCardDto] })
  recentRecipes: MyPageRecipeCardDto[];
  @ApiProperty({ type: [MyPageIngredientDto] })
  unavailableIngredients: MyPageIngredientDto[];
}
