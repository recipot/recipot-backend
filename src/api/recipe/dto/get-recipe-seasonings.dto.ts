import { ApiProperty } from '@nestjs/swagger';

export class RecipeSeasoningItemDto {
  @ApiProperty({
    description: '레시피 양념 ID',
    example: 1,
    type: 'number',
  })
  id: number;

  @ApiProperty({
    description: '양념 ID',
    example: 1,
    type: 'number',
  })
  seasoningId: number;

  @ApiProperty({
    description: '양념 이름',
    example: '간장',
    type: 'string',
  })
  name: string;

  @ApiProperty({
    description: '필요량',
    example: '2큰술',
    type: 'string',
  })
  amount: string;
}

export class GetRecipeSeasoningsResponseDto {
  @ApiProperty({
    description: '레시피 ID',
    example: 1,
    type: 'number',
  })
  recipeId: number;

  @ApiProperty({
    description: '레시피 양념 목록',
    type: [RecipeSeasoningItemDto],
    isArray: true,
  })
  seasonings: RecipeSeasoningItemDto[];
}
