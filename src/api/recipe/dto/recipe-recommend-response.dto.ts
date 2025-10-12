import { ApiProperty } from '@nestjs/swagger';

export class RecipeRecommendationConditionResponseDto {
  @ApiProperty({
    description: 'ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '레시피 ID',
    example: 1,
  })
  recipeId: number;

  @ApiProperty({
    description: '컨디션 ID',
    example: 1,
  })
  conditionId: number;

  @ApiProperty({
    description: '우선순위 점수',
    example: 1.0,
  })
  priorityScore: number;

  @ApiProperty({
    description: '생성일시',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    example: '2025-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
