import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class GetS3FoldersResponseDto {
  @ApiProperty({
    description: 'S3에 존재하는 1단계 폴더 목록',
    type: [String],
    example: ['recipes/', 'uploads/', 'thumbnails/'],
  })
  @IsArray()
  @IsString({ each: true })
  folders: string[];
}
