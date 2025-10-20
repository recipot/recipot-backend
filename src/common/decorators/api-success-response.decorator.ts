import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

type ApiSuccessOptions =
  | Type<any>
  | {
      type?: Type<any> | string;
      isArray?: boolean;
      [key: string]: any; // 기존 properties 등 다른 옵션들도 지원
    };

/**
 * Swagger API 성공 응답을 정의하는 데코레이터
 *
 * @description
 * API 성공 응답(200)의 구조를 자동으로 문서화합니다.
 * 응답은 항상 { status: 200, data: ... } 형태로 래핑됩니다.
 *
 * @param description - API 응답에 대한 설명
 * @param options - 응답 데이터 타입 및 스키마 옵션
 *
 * @example
 * // 1. 옵션 없이 사용 (data는 빈 객체)
 * @ApiSuccessResponse('성공')
 * // 응답: { status: 200, data: {} }
 *
 * @example
 * // 2. DTO 클래스를 직접 전달
 * @ApiSuccessResponse('사용자 정보 조회 성공', UserDto)
 * // 응답: { status: 200, data: UserDto }
 *
 * @example
 * // 3. 배열 응답 (isArray 옵션 사용)
 * @ApiSuccessResponse('사용자 목록 조회 성공', { type: UserDto, isArray: true })
 * // 응답: { status: 200, data: [UserDto, ...] }
 *
 * @example
 * // 4. 원시 타입 단일 값
 * @ApiSuccessResponse('ID 조회 성공', { type: 'string', format: 'uuid' })
 * // 응답: { status: 200, data: "uuid-string" }
 *
 * @example
 * // 5. 원시 타입 배열
 * @ApiSuccessResponse('ID 목록 조회 성공', { type: 'string', isArray: true, format: 'uuid' })
 * // 응답: { status: 200, data: ["uuid1", "uuid2", ...] }
 *
 * @example
 * // 6. 커스텀 스키마 (복잡한 구조)
 * @ApiSuccessResponse('통계 정보', {
 *   type: 'object',
 *   properties: {
 *     count: { type: 'number', example: 100 },
 *     average: { type: 'number', example: 75.5 }
 *   }
 * })
 * // 응답: { status: 200, data: { count: 100, average: 75.5 } }
 */
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
