import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class CommonRxDto {
  @ApiProperty({ example: '서버 코드' })
  @IsBoolean()
  public readonly statusCode: number;

  @ApiProperty({ example: '서버 메세지' })
  @IsString()
  public readonly message: string;
}
