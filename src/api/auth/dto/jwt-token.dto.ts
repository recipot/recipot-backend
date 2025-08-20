import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsJWT } from 'class-validator';

export class JwtToken {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImdyb3VwSWQiOjQsImlhdCI6MTcwMDU1NDUwMywiZXhwIjoxNzAwNTU4MTAzfQ.9iyM4IutSCYSBOaJuAdKm009_JnDshquM-kyMPXG58k',
    description: 'Access Token',
  })
  @IsJWT()
  public accessToken: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImdyb3VwSWQiOjQsImlhdCI6MTcwMDU1NDUwMywiZXhwIjoxNzAxMTU5MzAzfQ.9iyM05MTU5MzAzfQ.6-b8CjUqsZbPine3C4PWakFR3G6JYKIMmsHdTkm73yc',
    description: 'Refresh Token',
  })
  @IsJWT()
  public refreshToken: string;

  @ApiProperty({
    example: '2025-08-17T11:50:04.000Z',
    description: 'Access Token 만료 시간',
  })
  @IsDateString()
  public accessExpiresAt: string;

  @ApiProperty({
    example: '2025-08-18T10:50:04.000Z',
    description: 'Refresh Token 만료 시간',
  })
  @IsDateString()
  public refreshExpiresAt: string;
}
