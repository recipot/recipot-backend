import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '사용자 이메일', example: 'test@example.com' })
  email: string;

  @ApiProperty({ description: '사용자 닉네임', example: '닉네임' })
  nickname: string;

  @ApiProperty({ description: '프로필 이미지 URL', example: '' })
  profile_image_url: string;

  @ApiProperty({ description: '레시피 완료 횟수', example: 0 })
  recipe_complete_count: number;

  @ApiProperty({ description: '최초 진입 여부', example: true })
  is_first_entry: boolean;
}
