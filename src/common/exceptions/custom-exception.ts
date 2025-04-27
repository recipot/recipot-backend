import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomException extends HttpException {
  constructor(
    error: { code: string; message: string },
    status: number = HttpStatus.BAD_REQUEST, // 기본값 400
  ) {
    super(
      {
        status,
        code: error.code,
        message: error.message,
        result: null,
      },
      status,
    );
  }
}
