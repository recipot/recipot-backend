import { ApiProperty } from '@nestjs/swagger';

/**
 * [어드민] 양념 Upsert 응답 DTO
 */
export class UpsertAdminSeasoningsResponseDto {
  @ApiProperty({
    description: '생성된 양념 개수',
    example: 5,
  })
  createdCount: number;

  @ApiProperty({
    description: '수정된 양념 개수 (소프트 삭제 복원 포함)',
    example: 3,
  })
  updatedCount: number;

  @ApiProperty({
    description: '스킵된 양념 개수',
    example: 1,
  })
  skippedCount: number;
}
