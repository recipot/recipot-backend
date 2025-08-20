import { Public } from '@/api/auth/auth.decorators';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LoginService } from './login.service';

@ApiTags('로그인')
@Controller({ path: 'login', version: '1' })
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Get('kakao')
  @Public()
  @ApiOperation({
    summary: '카카오 로그인 URL 생성',
    description: '카카오 로그인을 위한 인증 URL을 생성합니다.',
  })
  @ApiSuccessResponse('카카오 로그인 URL 생성 성공', {
    type: 'string',
    example: 'https://kauth.kakao.com/oauth/authorize?...',
  })
  generateKakaoLoginUrl(): string {
    return this.loginService.generateKakaoLoginUrl();
  }

  @Get('kakao/callback')
  @Public()
  @ApiOperation({
    summary: '카카오 로그인 콜백 처리',
    description: '카카오 인증 후 받은 인가 코드로 로그인을 처리합니다.',
  })
  @ApiQuery({
    name: 'code',
    required: true,
    description: '카카오에서 받은 인가 코드',
  })
  @ApiSuccessResponse('카카오 로그인 성공', {
    type: 'object',
    properties: {
      userId: { type: 'number', example: 1 },
      accessToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      accessExpiresAt: { type: 'string', example: '2025-08-17T11:50:04.000Z' },
      refreshToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      refreshExpiresAt: { type: 'string', example: '2025-08-18T10:50:04.000Z' },
    },
  })
  async kakaoLoginCallback(@Query('code') code: string) {
    return await this.loginService.processKakaoLogin(code);
  }
}
