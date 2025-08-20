import { ApiProperty } from '@nestjs/swagger';

export class TokenVerificationResponseDto {
  @ApiProperty({ description: '토큰 유효성', example: true })
  isValid: boolean;

  @ApiProperty({ description: '토큰 만료 여부', example: false })
  isExpired: boolean;

  @ApiProperty({
    description: '토큰 만료 시간',
    example: '2025-08-17T10:00:00.000Z',
  })
  expiresAt: Date;
}
