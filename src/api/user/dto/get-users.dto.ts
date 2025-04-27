import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { GetUserDtoRx } from './get-user.dto';

export class GetUsersDtoRx {
  @ApiProperty({
    type: [GetUserDtoRx],
  })
  @IsArray()
  @ValidateNested({ each: true })
  public results: GetUserDtoRx[];

  @ApiProperty()
  public totalItems: number;
}
