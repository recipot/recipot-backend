import { ApiProperty } from '@nestjs/swagger';

export class IngredientItemDto {
  @ApiProperty({
    description: '카테고리 ID',
    example: 1,
    type: 'number',
  })
  categoryId: number;

  @ApiProperty({
    description: '카테고리 이름',
    example: '해산물류',
    type: 'string',
  })
  categoryName: string;

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

  @ApiProperty({
    description: '사용자가 못 먹는 음식 여부',
    example: false,
    type: 'boolean',
  })
  isUserRestricted: boolean;
}

export class GetIngredientsResponseDto {
  @ApiProperty({
    description: '재료 목록',
    type: [IngredientItemDto],
    isArray: true,
  })
  data: IngredientItemDto[];
}
