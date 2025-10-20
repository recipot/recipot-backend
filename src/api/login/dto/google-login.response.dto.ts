import { ApiProperty } from '@nestjs/swagger';

export class GoogleLoginResponseDto {
  @ApiProperty({ example: 'https://accounts.google.com/o/oauth2/v2/auth?...' })
  loginUrl: string;
}
