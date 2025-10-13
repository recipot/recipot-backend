import { ApiProperty } from '@nestjs/swagger';

export class GetPendingReviewsResponseDto {
  @ApiProperty({
    description: '후기 미작성 완료 레시피 ID 목록',
    example: [42, 38, 25],
    type: [Number],
  })
  completedRecipeIds: number[];

  @ApiProperty({
    description: '미작성 후기 개수',
    example: 3,
  })
  totalCount: number;
}
