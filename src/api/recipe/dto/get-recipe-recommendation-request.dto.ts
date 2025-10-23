import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class GetRecipeRecommendationRequestDto {
  @ApiProperty({
    description: '컨디션 ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  conditionId: number;

  @ApiProperty({
    description: '보유 재료 ID 배열',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayNotEmpty()
  pantryIds: number[];

  @ApiProperty({
    description: '페이지 번호 (1부터 시작)',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: '페이지당 아이템 수',
    example: 3,
    default: 3,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  pageSize?: number = 3;
}
