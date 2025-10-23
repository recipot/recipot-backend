import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Min,
} from 'class-validator';

export class RecipeRecommendRequestDto {
  @ApiProperty({
    description: '컨디션 ID',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  conditionId: number;

  @ApiProperty({
    description: '사용자가 보유한 재료 ID 목록',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @ArrayNotEmpty()
  pantryIds: number[];

  @ApiProperty({
    description: '페이지 번호 (기본값: 1)',
    example: 1,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: '페이지 크기 (기본값: 10)',
    example: 10,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;
}
