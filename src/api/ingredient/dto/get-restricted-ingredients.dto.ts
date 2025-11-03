import { ApiProperty } from '@nestjs/swagger';

export class RestrictedIngredientItemDto {
  @ApiProperty({
    type: Number,
    description: '재료 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: String,
    description: '재료 이름',
    example: '연어',
  })
  name: string;

  @ApiProperty({
    type: String,
    description: '카테고리 이름',
    example: '해산물류',
  })
  categoryName: string;

  @ApiProperty({
    type: Boolean,
    description: '사용자가 선택한 못먹는 재료 여부',
    example: false,
  })
  isUserRestricted: boolean;
}

export class GetRestrictedIngredientsResponseDto {
  @ApiProperty({
    type: [RestrictedIngredientItemDto],
    description: '제한 재료 목록',
  })
  data: RestrictedIngredientItemDto[];
}
