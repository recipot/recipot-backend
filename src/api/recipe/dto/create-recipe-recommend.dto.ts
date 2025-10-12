import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class CreateRecipeRecommendationConditionDto {
  @ApiProperty({
    description: '레시피 ID',
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  recipeId: number;

  @ApiProperty({
    description: '컨디션 ID',
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  conditionId: number;

  @ApiProperty({
    description: '우선순위 점수 (높을수록 더 적합)',
    example: 1.0,
    default: 1.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priorityScore?: number = 1.0;
}
