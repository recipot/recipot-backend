import { ApiProperty } from '@nestjs/swagger';

export class HealthSurveyEligibilityResponseDto {
  @ApiProperty({
    description: '지난 주에 완료한 레시피가 1건 이상이면 true',
    example: true,
  })
  isEligible: boolean;

  @ApiProperty({
    description: '지난 주 완료 횟수',
    example: 3,
  })
  recentCompletionCount: number;
}
