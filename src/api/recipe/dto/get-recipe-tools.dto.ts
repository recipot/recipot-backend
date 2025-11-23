import { ApiProperty } from '@nestjs/swagger';

export class RecipeToolItemDto {
  @ApiProperty({
    description: '레시피 조리도구 ID',
    example: 1,
    type: 'number',
  })
  id: number;

  @ApiProperty({
    description: '조리도구 ID',
    example: 1,
    type: 'number',
  })
  toolId: number;

  @ApiProperty({
    description: '조리도구 이름',
    example: '프라이팬(원팬)',
    type: 'string',
  })
  name: string;

  @ApiProperty({
    description: '조리도구 이미지 주소',
    example: 'https://example.com/pan.jpg',
    type: 'string',
  })
  imageUrl: string;
}

export class GetRecipeToolsResponseDto {
  @ApiProperty({
    description: '레시피 ID',
    example: 1,
    type: 'number',
  })
  recipeId: number;

  @ApiProperty({
    description: '레시피 조리도구 목록',
    type: [RecipeToolItemDto],
    isArray: true,
  })
  tools: RecipeToolItemDto[];
}
