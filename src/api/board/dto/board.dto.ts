import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDate, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { GetUserDtoRx } from '@/api/user/dto/get-user.dto';

export class BoardDto {
  @ApiProperty({ description: '게시글 고유 ID', example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: '게시글 제목',
    example: 'NestJS 게시판 만들기',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: '게시글 본문 내용',
    example: 'NestJS와 TypeORM을 이용하여 게시판을 만들어 봅니다.',
  })
  @IsString()
  content: string;

  @ApiProperty({ type: () => GetUserDtoRx })
  createdBy: GetUserDtoRx;

  @ApiProperty({
    description: '게시글 작성 일자 (ISO 포맷)',
    example: '2025-04-26T12:34:56.789Z',
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ type: () => GetUserDtoRx })
  updatedBy?: GetUserDtoRx;

  @ApiProperty({})
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
}
