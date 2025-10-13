import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';

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
  pantryIds: number[];
}
