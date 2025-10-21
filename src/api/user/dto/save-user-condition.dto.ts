import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber } from 'class-validator';

export class SaveUserConditionDto {
  @ApiProperty({
    description: '컨디션 ID',
    example: 1,
    type: Number,
  })
  @IsNumber()
  conditionId: number;

  @ApiProperty({
    description: '추천 단계까지 진행했는지 여부',
    example: false,
    type: Boolean,
  })
  @IsBoolean()
  isRecommendationStarted: boolean;
}

export class SaveUserConditionResponseDto {
  @ApiProperty({
    description: '저장된 컨디션 ID',
    example: 1,
    type: Number,
  })
  conditionId: number;
}
