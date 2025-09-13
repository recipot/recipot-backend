import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';

export class UpdateMyProfileDto {
  @ApiPropertyOptional({ example: '요리왕비룡', description: '닉네임' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  nickname?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatar.png',
    description: '프로필 이미지 주소',
  })
  @IsOptional()
  @IsUrl()
  profile_image_url?: string;

  @ApiPropertyOptional({
    example: false,
    description: '최초 진입 여부(온보딩 완료 시 false)',
  })
  @IsOptional()
  @IsBoolean()
  is_first_entry?: boolean;
}
