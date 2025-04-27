import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '아이디' })
  @IsString()
  public passid!: string;

  @ApiProperty({ description: '비밀번호' })
  @IsString()
  public password!: string;
}
