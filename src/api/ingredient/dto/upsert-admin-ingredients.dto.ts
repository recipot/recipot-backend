import { ApiProperty } from '@nestjs/swagger';

/**
 * [어드민] 식재료 Upsert 응답 DTO
 */
export class UpsertAdminIngredientsResponseDto {
  @ApiProperty({
    description: '생성된 식재료 개수',
    example: 5,
  })
  createdCount: number;

  @ApiProperty({
    description: '수정된 식재료 개수',
    example: 3,
  })
  updatedCount: number;

  @ApiProperty({
    description: '스킵된 식재료 개수',
    example: 1,
  })
  skippedCount: number;
}
