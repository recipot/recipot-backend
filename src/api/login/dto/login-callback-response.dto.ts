import { ApiProperty } from '@nestjs/swagger';

class UserInfoDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '사용자 이메일', example: 'test@example.com' })
  email: string;

  @ApiProperty({ description: '사용자 닉네임', example: 'nickname' })
  nickname: string;

  @ApiProperty({ description: '프로필 이미지 URL', example: 'url' })
  profile_image_url: string;

  @ApiProperty({ description: '첫 방문 여부', example: false })
  is_first_entry: boolean;
}

class TokenInfoDto {
  @ApiProperty({ description: '액세스 토큰', example: 'dsfasdfasdfa' })
  accessToken: string;

  @ApiProperty({ description: '액세스 토큰 만료 시간', example: 1 })
  accessExpire: number;
}

export class LoginCallbackResponseDto {
  @ApiProperty({
    description: '사용자 정보',
    type: UserInfoDto,
  })
  user: UserInfoDto;

  @ApiProperty({
    description: '토큰 정보',
    type: TokenInfoDto,
  })
  token: TokenInfoDto;
}
