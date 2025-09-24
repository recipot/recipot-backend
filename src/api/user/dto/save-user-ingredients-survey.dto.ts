import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';

export class SaveUserIngredientsSurveyDto {
  @ApiProperty({
    description: '사용자가 보유한 재료 ID 배열',
    example: [1, 2, 3, 4, 5],
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1, { message: '최소 1개 이상의 재료 ID가 필요합니다.' })
  ingredientIds: number[];
}

export class SaveUserIngredientsSurveyResponseDto {
  @ApiProperty({
    description: '저장된 재료 ID 배열',
    example: [1, 2, 3, 4, 5],
    type: [Number],
  })
  ingredientIds: number[];

  @ApiProperty({
    description: '캐시 만료 시간 (초)',
    example: 604800,
    type: 'number',
  })
  cacheTtl: number;

  @ApiProperty({
    description: '설문 완료 메시지',
    example: '보유 재료 설문이 완료되었습니다.',
    type: 'string',
  })
  message: string;
}
