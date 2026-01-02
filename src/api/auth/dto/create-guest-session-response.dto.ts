import { ApiProperty } from '@nestjs/swagger';

export class CreateGuestSessionResponseDto {
  @ApiProperty({
    description: '게스트 세션 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  guestSessionId: string;

  @ApiProperty({
    description: '세션 만료 시간',
    example: '2024-01-10T12:00:00.000Z',
  })
  expiresAt: string;
}
