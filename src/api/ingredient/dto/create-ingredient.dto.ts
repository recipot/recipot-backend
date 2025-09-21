import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateIngredientHealthInfoDto {
  @ApiProperty({
    description: '건강 정보 내용',
    example: '오메가-3 지방산이 풍부하여 심혈관 건강에 도움이 됩니다.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CreateIngredientDto {
  @ApiProperty({
    description: '재료 카테고리 ID',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  ingredient_category_id: number;

  @ApiProperty({
    description: '재료 이름',
    example: '고등어',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '재료 건강 정보 배열',
    type: [CreateIngredientHealthInfoDto],
    example: [
      { content: '오메가-3 지방산이 풍부하여 심혈관 건강에 도움이 됩니다.' },
      { content: '단백질이 풍부하여 근육 건강에 좋습니다.' },
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateIngredientHealthInfoDto)
  health_infos: CreateIngredientHealthInfoDto[];
}

export class CreateIngredientDtoTx {
  @ApiProperty({
    description: '생성할 재료 객체들의 배열',
    type: [CreateIngredientDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateIngredientDto)
  data: CreateIngredientDto[];
}

export class IngredientHealthInfoResponseDto {
  @ApiProperty({ description: '건강 정보 ID', example: 1 })
  id: number;

  @ApiProperty({
    description: '건강 정보 내용',
    example: '오메가-3 지방산이 풍부하여 심혈관 건강에 도움이 됩니다.',
  })
  content: string;
}

export class IngredientResponseDto {
  @ApiProperty({ description: '재료 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '재료 이름', example: '고등어' })
  name: string;

  @ApiProperty({ description: '재료 카테고리 ID', example: 1 })
  ingredientCategoryId: number;

  @ApiProperty({
    description: '재료 건강 정보 목록',
    type: [IngredientHealthInfoResponseDto],
  })
  healthInfos: IngredientHealthInfoResponseDto[];
}
