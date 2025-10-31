import { Public } from '@/api/auth/decorators/auth.decorators';
import { GoogleLoginResponseDto } from '@/api/login/dto/google-login.response.dto';
import { LoginCallbackResponseDto } from '@/api/login/dto/login-callback-response.dto';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
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
  async generateKakaoLoginUrl(): Promise<string> {
    return await this.loginService.generateKakaoLoginUrl();
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
    },
  })
  async kakaoLoginCallback(@Query('code') code: string, @Res() res: Response) {
    await this.loginService.processKakaoLogin(code, res);

    // 웹 전용: 쿠키에 토큰이 설정된 상태에서 프론트 콜백으로 리다이렉트
    const redirectUrl = new URL(process.env.FRONTEND_LOGIN_CALLBACK_URL);
    return res.redirect(302, redirectUrl.toString());
  }

  @Public()
  @Get('google')
  @ApiOperation({ summary: '구글 로그인 URL 생성' })
  @ApiSuccessResponse('구글 로그인 URL 생성 성공', GoogleLoginResponseDto)
  generateGoogleLoginUrl(): GoogleLoginResponseDto {
    const loginUrl = this.loginService.generateGoogleLoginUrl();
    return { loginUrl };
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: '구글 로그인 콜백 처리' })
  @ApiQuery({
    name: 'code',
    required: true,
    description: '구글에서 받은 인가 코드',
  })
  @ApiSuccessResponse('구글 로그인 성공', LoginCallbackResponseDto)
  async googleLoginCallback(
    @Query('code') code: string,
  ): Promise<LoginCallbackResponseDto> {
    return await this.loginService.handleGoogleCallback(code);
  }
}
