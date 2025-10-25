import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '사용자 이메일', example: 'test@example.com' })
  email: string;

  @ApiProperty({ description: '사용자 닉네임', example: '닉네임' })
  nickname: string;

  @ApiProperty({ description: '프로필 이미지 URL', example: '' })
  profileImageUrl: string;

  @ApiProperty({ description: '레시피 완료 횟수', example: 0 })
  recipeCompleteCount: number;

  @ApiProperty({ description: '사용자 레벨', example: 1 })
  level: number;

  @ApiProperty({ description: '최초 진입 여부', example: true })
  isFirstEntry: boolean;

  @ApiProperty({ description: '유저 권한', example: 'general' })
  role: string;

  @ApiProperty({
    description: '소셜 로그인 플랫폼',
    example: 'kakao',
    required: false,
  })
  platform?: string;

  @ApiProperty({ description: '생성일시', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
