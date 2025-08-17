import { ERROR_CODES } from '@/common/constants/error-codes';
import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export const ApiErrorResponse = (
  status: number,
  errorCode: (typeof ERROR_CODES)[keyof typeof ERROR_CODES],
) => {
  return applyDecorators(
    ApiResponse({
      status,
      description: errorCode.message,
      schema: {
        type: 'object',
        properties: {
          status: { type: 'number', example: status },
          data: { type: 'null', example: null },
          code: { type: 'string', example: errorCode.code },
          message: { type: 'string', example: errorCode.message },
        },
      },
    }),
  );
};
