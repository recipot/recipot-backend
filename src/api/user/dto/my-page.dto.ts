import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class MyPageRecipeCardDto {
  @ApiProperty({ example: 12 }) id: number;
  @ApiProperty({ example: '간장 고등어 구이' }) title: string;
  @ApiProperty({ example: 'https://cdn.example.com/r/12.jpg', nullable: true })
  imageUrl?: string | null;
}

export class MyPageIngredientDto {
  @ApiProperty({ example: 3 }) id: number;
  @ApiProperty({ example: '게' }) name: string;
  @ApiProperty({ example: '해산물류', nullable: true })
  categoryName?: string | null;
}

export class MyPageSummaryDto {
  @ApiProperty({ type: UserDto })
  profile: UserDto;

  @ApiProperty({
    example: {
      cookedCount: 12,
      savedCount: 5,
      recentCount: 3,
      unavailableCount: 25,
    },
  })
  stats: {
    cookedCount: number;
    savedCount: number;
    recentCount: number;
    unavailableCount: number;
  };

  @ApiProperty({ type: [MyPageRecipeCardDto] })
  savedRecipes: MyPageRecipeCardDto[];

  @ApiProperty({ type: [MyPageRecipeCardDto] })
  recentRecipes: MyPageRecipeCardDto[];

  @ApiProperty({ type: [MyPageIngredientDto] })
  unavailableIngredients: MyPageIngredientDto[];
}
