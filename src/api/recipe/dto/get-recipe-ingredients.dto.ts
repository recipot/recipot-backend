import { ApiProperty } from '@nestjs/swagger';

export class RecipeIngredientItemDto {
  @ApiProperty({
    description: '레시피 재료 ID',
    example: 1,
    type: 'number',
  })
  id: number;

  @ApiProperty({
    description: '재료 ID',
    example: 1,
    type: 'number',
  })
  ingredientId: number;

  @ApiProperty({
    description: '재료 이름',
    example: '고등어',
    type: 'string',
  })
  name: string;

  @ApiProperty({
    description: '필요량',
    example: '1마리',
    type: 'string',
  })
  amount: string;

  @ApiProperty({
    description: '대체 가능 여부',
    example: false,
    type: 'boolean',
  })
  isAlternative: boolean;
}

export class GetRecipeIngredientsResponseDto {
  @ApiProperty({
    description: '레시피 ID',
    example: 1,
    type: 'number',
  })
  recipeId: number;

  @ApiProperty({
    description: '레시피 식재료 목록',
    type: [RecipeIngredientItemDto],
    isArray: true,
  })
  ingredients: RecipeIngredientItemDto[];
}
