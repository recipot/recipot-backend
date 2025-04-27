import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNumber } from 'class-validator';

export class JwtToken {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImdyb3VwSWQiOjQsImlhdCI6MTcwMDU1NDUwMywiZXhwIjoxNzAwNTU4MTAzfQ.9iyM4IutSCYSBOaJuAdKm009_JnDshquM-kyMPXG58k',
  })
  @IsJWT()
  public accessToken: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImdyb3VwSWQiOjQsImlhdCI6MTcwMDU1NDUwMywiZXhwIjoxNzAxMTU5MzAzfQ.6-b8CjUqsZbPine3C4PWakFR3G6JYKIMmsHdTkm73yc',
  })
  @IsJWT()
  public refreshToken: string;

  @ApiProperty({ example: 3600 })
  @IsNumber()
  public accessExpire: number;

  @ApiProperty({ example: 86400 })
  @IsNumber()
  public refreshExpire: number;
}
