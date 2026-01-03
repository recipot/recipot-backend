import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MigrateGuestDto {
  @ApiProperty({
    description: '게스트 세션 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  guestSessionId: string;
}

export class MigrateGuestResponseDto {
  @ApiProperty({
    description: '마이그레이션된 못먹는 재료 개수',
    example: 5,
  })
  migratedUnavailableIngredientsCount: number;

  @ApiProperty({
    description: '마이그레이션 성공 여부',
    example: true,
  })
  success: boolean;
}
