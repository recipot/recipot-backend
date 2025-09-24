import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateIngredientCategoryDto {
  @ApiProperty({ description: '카테고리 이름', example: '해산물류' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateIngredientCategoryDtoTx {
  @ApiProperty({
    description: '생성할 재료 카테고리 객체들의 배열',
    type: [CreateIngredientCategoryDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateIngredientCategoryDto)
  data: CreateIngredientCategoryDto[];
}
