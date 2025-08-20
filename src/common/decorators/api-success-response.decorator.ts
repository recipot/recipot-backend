import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export const ApiSuccessResponse = (description: string, dataSchema?: any) => {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description,
      schema: {
        type: 'object',
        properties: {
          status: { type: 'number', example: 200 },
          data: dataSchema || { type: 'object' },
        },
      },
    }),
  );
};
