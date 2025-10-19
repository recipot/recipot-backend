import { PaginationDto } from '@/common/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';

export class GetIngredientCategoriesDto extends PaginationDto {}

export class IngredientCategoryResponseDto {
  @ApiProperty({
    description: '카테고리 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '카테고리 이름',
    example: '해산물류',
  })
  name: string;
}

export class GetIngredientCategoriesResponseDto {
  @ApiProperty({
    description: '재료 카테고리 목록',
    type: [IngredientCategoryResponseDto],
  })
  data: IngredientCategoryResponseDto[];
}
