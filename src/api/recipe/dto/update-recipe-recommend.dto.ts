import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateRecipeRecommendationConditionDto {
  @ApiProperty({
    description: '우선순위 점수 (높을수록 더 적합)',
    example: 1.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priorityScore?: number;
}
