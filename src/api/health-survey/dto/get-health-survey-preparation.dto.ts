import { ApiProperty } from '@nestjs/swagger';

export class HealthSurveyCodeOptionDto {
  @ApiProperty({ description: '코드 값', example: 'H01001' })
  code: string;

  @ApiProperty({ description: '코드명', example: '더 심해졌어요.' })
  codeName: string;
}

export class GetHealthSurveyPreparationResponseDto {
  @ApiProperty({
    description: '평소 겪던 건강 문제',
    type: [HealthSurveyCodeOptionDto],
  })
  persistentIssueOption: HealthSurveyCodeOptionDto[];

  @ApiProperty({
    description: '느낀 변화',
    type: [HealthSurveyCodeOptionDto],
  })
  effectOptions: HealthSurveyCodeOptionDto[];
}
