import { ApiProperty, PickType } from '@nestjs/swagger';
import { JwtToken } from '../../auth/dto/jwt-token.dto';

export class LoginCallbackResponseDto extends PickType(JwtToken, [
  'accessToken',
  'accessExpiresAt',
  'refreshToken',
  'refreshExpiresAt',
] as const) {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;
}
