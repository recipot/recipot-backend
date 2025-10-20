import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

type ApiSuccessOptions =
  | Type<any>
  | {
      type?: Type<any> | string;
      isArray?: boolean;
      [key: string]: any; // 기존 properties 등 다른 옵션들도 지원
    };

export const ApiSuccessResponse = (
  description: string,
  options?: ApiSuccessOptions,
) => {
  // 옵션이 없거나 타입만 전달된 경우
  if (!options) {
    return applyDecorators(
      ApiResponse({
        status: 200,
        description,
        schema: {
          type: 'object',
          properties: {
            status: { type: 'integer', format: 'int32', example: 200 },
            data: { type: 'object' },
          },
        },
      }),
    );
  }

  // 클래스 타입이 직접 전달된 경우 (예: ApiSuccessResponse('...', MyDto))
  if (typeof options === 'function') {
    return applyDecorators(
      ApiExtraModels(options as Type<any>),
      ApiResponse({
        status: 200,
        description,
        schema: {
          type: 'object',
          properties: {
            status: { type: 'integer', format: 'int32', example: 200 },
            data: { $ref: getSchemaPath(options as Type<any>) },
          },
        },
      }),
    );
  }

  // 객체 형태의 옵션이 전달된 경우
  const { type, isArray, ...rest } = options as any;

  // type이 클래스인 경우
  if (typeof type === 'function') {
    return applyDecorators(
      ApiExtraModels(type as Type<any>),
      ApiResponse({
        status: 200,
        description,
        schema: {
          type: 'object',
          properties: {
            status: { type: 'integer', format: 'int32', example: 200 },
            data: isArray
              ? {
                  type: 'array',
                  items: { $ref: getSchemaPath(type as Type<any>) },
                }
              : { $ref: getSchemaPath(type as Type<any>) },
          },
        },
      }),
    );
  }

  // type이 문자열(원시 스키마)인 경우 (예: { type: 'string', isArray: true, format: 'uuid' })
  if (typeof type === 'string') {
    return applyDecorators(
      ApiResponse({
        status: 200,
        description,
        schema: {
          type: 'object',
          properties: {
            status: { type: 'integer', format: 'int32', example: 200 },
            data: isArray
              ? { type: 'array', items: { type, ...rest } }
              : { type, ...rest },
          },
        },
      }),
    );
  }

  // 기존 방식: properties나 다른 스키마 옵션이 직접 전달된 경우
  // (예: { type: 'object', properties: { ... } })
  return applyDecorators(
    ApiResponse({
      status: 200,
      description,
      schema: {
        type: 'object',
        properties: {
          status: { type: 'integer', format: 'int32', example: 200 },
          data: options as any, // 전달된 스키마를 그대로 사용
        },
      },
    }),
  );
};
