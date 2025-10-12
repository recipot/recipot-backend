import { ApiProperty } from '@nestjs/swagger';
import { CreateRecipeRecommendationConditionDto } from './create-recipe-recommend.dto';

export class CreateRecipeRecommendationConditionRequest {
  @ApiProperty({
    description: '레시피 추천 컨디션 데이터 배열',
    type: [CreateRecipeRecommendationConditionDto],
  })
  data: CreateRecipeRecommendationConditionDto[];
}
