import { ApiProperty } from '@nestjs/swagger';

export class ConditionResponseDto {
  @ApiProperty({
    description: '컨디션 ID',
    example: 1,
    type: 'number',
  })
  id: number;

  @ApiProperty({
    description: '컨디션 이름',
    example: '힘들러',
    type: 'string',
  })
  name: string;
}

export class GetConditionsResponseDto {
  @ApiProperty({
    description: '컨디션 목록',
    type: [ConditionResponseDto],
    isArray: true,
  })
  conditions: ConditionResponseDto[];
}
