import { ApiProperty } from '@nestjs/swagger';

export class GetUserConditionResponseDto {
  @ApiProperty({
    description: '사용자가 저장한 컨디션 ID (없으면 null)',
    example: 1,
    type: Number,
    nullable: true,
  })
  conditionId: number | null;
}
