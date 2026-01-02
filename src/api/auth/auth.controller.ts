import { ERROR_CODES } from '@/common/constants/error-codes';
import { ApiErrorResponse } from '@/common/decorators/api-error-response.decorator';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from '@/api/auth/decorators/auth.decorators';
import { CreateGuestSessionResponseDto } from '@/api/auth/dto/create-guest-session-response.dto';
import { JwtToken } from '@/api/auth/dto/jwt-token.dto';
import { RefreshTokenRequestDto } from '@/api/auth/dto/refresh-token-request.dto';
import { TokenVerificationRequestDto } from '@/api/auth/dto/token-verification-request.dto';
import { TokenVerificationResponseDto } from '@/api/auth/dto/token-verification-response.dto';

@ApiTags('인증 관리')
@Controller({ path: 'auth', version: '1' })
@ApiBearerAuth('Authorization')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify')
  @Public()
  @ApiOperation({
    summary: 'JWT 토큰 검증',
    description: '제공된 JWT 토큰의 유효성을 검증합니다.',
  })
  @ApiBody({ type: TokenVerificationRequestDto })
  @ApiSuccessResponse('토큰 검증 성공', {
    type: 'object',
    properties: {
      isValid: { type: 'boolean', example: true },
      isExpired: { type: 'boolean', example: false },
      expiresAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-08-17T10:00:00.000Z',
      },
    },
  })
  @ApiErrorResponse(401, ERROR_CODES.AUTH_INVALID_TOKEN)
  async verifyToken(
    @Body() verifyDto: TokenVerificationRequestDto,
  ): Promise<TokenVerificationResponseDto> {
    return await this.authService.verifyToken(verifyDto.token);
  }

  @Post('refresh')
  @Public()
  @ApiOperation({
    summary: 'Refresh Token으로 새로운 토큰 발급',
    description:
      'Refresh Token을 사용하여 새로운 Access Token과 Refresh Token을 발급합니다.',
  })
  @ApiBody({ type: RefreshTokenRequestDto, required: false })
  @ApiSuccessResponse('토큰 재발급 성공', {
    type: 'object',
    properties: {
      status: { type: 'number', example: 200 },
      accessToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      refreshToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      accessExpiresAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-08-17T11:50:04.000Z',
      },
      refreshExpiresAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-08-18T10:50:04.000Z',
      },
    },
  })
  @ApiErrorResponse(401, ERROR_CODES.AUTH_INVALID_REFRESH_TOKEN)
  @ApiErrorResponse(401, ERROR_CODES.AUTH_REFRESH_TOKEN_EXPIRED)
  async refreshToken(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
    @Body() body?: RefreshTokenRequestDto,
  ) {
    return await this.authService.refreshAccessTokenWithCookie(
      body?.refreshToken,
      req,
      res,
    );
  }

  @Get('info/:userId')
  @ApiOperation({
    summary: '사용자 토큰 정보 조회',
    description: '특정 사용자의 현재 토큰 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'userId',
    description: '사용자 ID',
    type: 'number',
  })
  @ApiSuccessResponse('토큰 정보 조회 성공', {
    type: 'object',
    properties: {
      accessToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      refreshToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      accessExpiresAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-08-17T11:50:04.000Z',
      },
      refreshExpiresAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-08-18T10:50:04.000Z',
      },
    },
  })
  @ApiErrorResponse(401, ERROR_CODES.AUTH_REQUIRED)
  @ApiErrorResponse(404, ERROR_CODES.USER_NOT_FOUND)
  async getTokenInfo(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<JwtToken | { exists: false }> {
    return await this.authService.getTokenInfo(userId);
  }

  @Get('expiration/:token')
  @Public()
  @ApiOperation({
    summary: '토큰 만료 정보 조회',
    description: '제공된 토큰의 만료 시간과 만료 여부를 확인합니다.',
  })
  @ApiParam({
    name: 'token',
    description: 'JWT 토큰',
    type: 'string',
  })
  @ApiSuccessResponse('토큰 만료 정보 조회 성공', {
    type: 'object',
    properties: {
      expiresAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-08-17T10:00:00.000Z',
      },
      isExpired: {
        type: 'boolean',
        example: false,
      },
    },
  })
  @ApiErrorResponse(400, ERROR_CODES.INVALID_FORMAT)
  async getTokenExpiration(@Param('token') token: string) {
    return await this.authService.getTokenExpiration(token);
  }

  @Post('debug')
  @Public()
  @ApiOperation({
    summary: '테스트용 임시 토큰 발급',
    description: '개발/테스트를 위한 임시 JWT 토큰을 발급합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'number',
          example: 1,
          description: '테스트할 사용자 ID',
        },
        role: {
          type: 'string',
          example: 'U01001',
          description: '테스트할 사용자 ROLE',
        },
      },
      required: ['userId'],
    },
  })
  @ApiSuccessResponse('테스트 토큰 발급 성공', {
    type: 'object',
    properties: {
      accessToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      refreshToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      accessExpiresAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-08-17T11:50:04.000Z',
      },
      refreshExpiresAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-08-18T10:50:04.000Z',
      },
    },
  })
  @ApiErrorResponse(400, ERROR_CODES.VALIDATION_ERROR)
  async generateDebugToken(
    @Body() body: { userId: number; role: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.authService.generateDebugToken(
      body.userId,
      body.role,
      res,
    );
  }

  @Post('logout')
  @ApiOperation({
    summary: '로그아웃',
    description: 'Access/Refresh 토큰을 무효화합니다.',
  })
  @ApiSuccessResponse('로그아웃 성공', {
    type: 'object',
    properties: {
      status: { type: 'number', example: 200 },
      data: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
        },
      },
    },
  })
  @ApiErrorResponse(401, ERROR_CODES.AUTH_REQUIRED)
  async logout(@Req() req: any) {
    const bearer = req.headers?.authorization ?? '';
    const token = bearer.startsWith('Bearer ') ? bearer.slice(7) : '';

    if (!token) {
      throw new UnauthorizedException(ERROR_CODES.AUTH_REQUIRED.message);
    }

    const result = await this.authService.logout(token);
    return { status: 200, data: result };
  }

  @Post('guest-session')
  @Public()
  @ApiOperation({
    summary: '게스트 세션 발급',
    description:
      '비로그인 사용자를 위한 임시 세션 ID를 발급합니다. 7일간 유효합니다.',
  })
  @ApiSuccessResponse('게스트 세션 발급 성공', {
    type: CreateGuestSessionResponseDto,
  })
  async createGuestSession(): Promise<CreateGuestSessionResponseDto> {
    return await this.authService.createGuestSession();
  }
}
