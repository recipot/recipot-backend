import { Public } from '@/api/auth/decorators/auth.decorators';
import { GoogleLoginResponseDto } from '@/api/login/dto/google-login.response.dto';
import { LoginCallbackResponseDto } from '@/api/login/dto/login-callback-response.dto';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { Controller, Get, Query, Res, Param } from '@nestjs/common';
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
  @ApiSuccessResponse('카카오 로그인 성공')
  async kakaoLoginCallback(
    @Query('code') code: string,
    @Res() res: Response,
  ): Promise<void> {
    const sessionKey = await this.loginService.processKakaoLogin(code);

    const redirectUrl = new URL(process.env.FRONTEND_LOGIN_CALLBACK_URL);
    redirectUrl.searchParams.set('sessionKey', sessionKey);

    return res.redirect(302, redirectUrl.toString());
  }

  @Get('session/:sessionKey')
  @Public()
  @ApiOperation({
    summary: '로그인 세션 조회',
    description: '캐시된 토큰 정보를 조회합니다. (1회용)',
  })
  @ApiSuccessResponse('로그인 세션 조회 성공', LoginCallbackResponseDto)
  async getLoginSession(
    @Param('sessionKey') sessionKey: string,
  ): Promise<LoginCallbackResponseDto> {
    return await this.loginService.retrieveLoginSession(sessionKey);
  }

  // ApiSuccessResponse 사용 시 Swagger 번들에서
  //    'swagger_1 is not defined' 런타임 오류가 발생하여
  //    구글 엔드포인트만 표준 @ApiOkResponse로 표기합니다.
  @Public()
  @Public()
  @Get('google')
  @ApiOperation({ summary: '구글 로그인 URL 생성' })
  @ApiSuccessResponse('구글 로그인 URL 생성 성공', GoogleLoginResponseDto)
  generateGoogleLoginUrl(): GoogleLoginResponseDto {
    const loginUrl = this.loginService.generateGoogleLoginUrl();
    return { loginUrl };
  }

  // ApiSuccessResponse 사용 시 Swagger 번들에서
  //    'swagger_1 is not defined' 런타임 오류가 발생하여
  //    구글 엔드포인트만 표준 @ApiOkResponse로 표기합니다.
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
