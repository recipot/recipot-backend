import { ApiProperty } from '@nestjs/swagger';

export class KakaoLoginResponseDto {
  @ApiProperty({
    description: '카카오 로그인 URL',
    example: 'https://kauth.kakao.com/oauth/authorize?client_id=...',
  })
  loginUrl: string;
}
