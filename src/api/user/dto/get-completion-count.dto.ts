import { ApiProperty } from '@nestjs/swagger';

export class GetCompletionCountResponseDto {
  @ApiProperty({
    example: 7,
    description: 'Total number of recipe completions',
  })
  count: number;
}
