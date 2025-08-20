import { PickType } from '@nestjs/swagger';
import { JwtToken } from './jwt-token.dto';

export class RefreshTokenResponseDto extends PickType(JwtToken, [
  'accessToken',
  'refreshToken',
  'accessExpiresAt',
  'refreshExpiresAt',
]) {}
