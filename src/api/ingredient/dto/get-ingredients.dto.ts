import { ApiProperty } from '@nestjs/swagger';

export class IngredientItemDto {
  @ApiProperty({
    description: '재료 ID',
    example: 1,
    type: 'number',
  })
  id: number;

  @ApiProperty({
    description: '재료 이름',
    example: '고등어',
    type: 'string',
  })
  name: string;
}

export class GetIngredientsResponseDto {
  @ApiProperty({
    description: '재료 목록',
    type: [IngredientItemDto],
    isArray: true,
  })
  data: IngredientItemDto[];
}
