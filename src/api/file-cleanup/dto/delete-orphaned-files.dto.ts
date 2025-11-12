import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
  IsNumber,
} from 'class-validator';

export class DeleteOrphanedFilesRequestDto {
  @ApiProperty({
    description: '삭제할 S3 Key 배열 (최대 1000개)',
    type: [String],
    example: ['recipes/999/1.png', 'recipes/999/2.png'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: '최소 1개 이상의 Key가 필요합니다' })
  @ArrayMaxSize(1000, { message: '최대 1000개까지만 삭제 가능합니다' })
  keys: string[];
}

export class DeletedFileDto {
  @ApiProperty({
    description: '삭제된 S3 Key',
    example: 'recipes/999/1.png',
  })
  @IsString()
  key: string;
}

export class DeleteOrphanedFilesResponseDto {
  @ApiProperty({
    description: '성공적으로 삭제된 파일 개수',
    example: 10,
  })
  @IsNumber()
  deletedCount: number;

  @ApiProperty({
    description: '삭제된 파일 목록',
    type: [DeletedFileDto],
  })
  @IsArray()
  deletedFiles: DeletedFileDto[];

  @ApiProperty({
    description: '삭제 실패한 파일 개수',
    example: 2,
  })
  @IsNumber()
  failedCount: number;

  @ApiProperty({
    description: '삭제 실패한 파일 Key 목록',
    type: [String],
    example: ['uploads/error-1.jpg'],
  })
  @IsArray()
  @IsString({ each: true })
  failedKeys: string[];
}
