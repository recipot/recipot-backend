import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class UserDto {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  nickName: string;

  @ApiProperty()
  @IsString()
  cookingLevel: string;

  @ApiProperty()
  @IsString()
  householdType: string;

  @ApiProperty()
  @IsString()
  job: string;
}
