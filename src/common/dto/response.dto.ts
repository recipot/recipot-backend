import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class ResponseDto<T> {
  constructor(status: number, result?: T, code?: string, message?: string) {
    this.status = status;
    if (result !== undefined) this.result = result;
    if (code !== undefined) this.code = code;
    if (message !== undefined) this.message = message;
  }

  @ApiProperty({ example: 200, description: 'HTTP 상태 코드' })
  @Expose()
  status: number;

  @ApiProperty({
    description: '응답 데이터',
    nullable: true,
    required: false,
  })
  @Expose()
  @Transform(({ value }) => (value === undefined ? undefined : value), {
    toPlainOnly: true, // JSON 응답 직렬화 시에만 적용
  })
  result?: T;

  @ApiProperty({
    description: '실패 시 서비스 에러 코드 반환',
    required: false,
    nullable: true,
    example: null,
  })
  @Expose()
  @Transform(({ value }) => (value === undefined ? undefined : value), {
    toPlainOnly: true,
  })
  code?: string;

  @ApiProperty({
    description: '실패 시 에러 메시지 반환',
    required: false,
    nullable: true,
    example: null,
  })
  @Expose()
  @Transform(({ value }) => (value === undefined ? undefined : value), {
    toPlainOnly: true,
  })
  message?: string;

  static success<T>(result: T): ResponseDto<T> {
    return new ResponseDto(200, result);
  }

  static error(
    status: number,
    code: string,
    message: string,
  ): ResponseDto<null> {
    return new ResponseDto(status, undefined, code, message);
  }
}
