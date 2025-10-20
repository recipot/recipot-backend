import { ApiProperty } from '@nestjs/swagger';
import { RecipeRecommendationConditionResponseDto } from './recipe-recommend-response.dto';

export class GetRecipeRecommendationConditionsResponseDto {
  @ApiProperty({
    description: '레시피 추천 컨디션 목록',
    type: [RecipeRecommendationConditionResponseDto],
  })
  data: RecipeRecommendationConditionResponseDto[];

  @ApiProperty({
    description: '총 개수',
    example: 10,
  })
  total: number;
}
