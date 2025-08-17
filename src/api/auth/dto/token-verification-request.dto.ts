import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsString } from 'class-validator';

export class TokenVerificationRequestDto {
  @ApiProperty({
    description: '검증할 JWT 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsJWT()
  @IsString()
  token: string;
}
