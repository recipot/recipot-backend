import { Public } from '@/api/auth/decorators/auth.decorators';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { Controller, Get, Query, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { LoginService } from './login.service';
import { LoginCallbackResponseDto } from '@/api/login/dto/login-callback-response.dto';
import { GoogleLoginResponseDto } from '@/api/login/dto/google-login.response.dto';

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
    },
  })
  async kakaoLoginCallback(@Query('code') code: string, @Res() res: Response) {
    const result = await this.loginService.processKakaoLogin(code, res);

    const redirectUrl = new URL(process.env.FRONTEND_LOGIN_CALLBACK_URL);
    redirectUrl.searchParams.set('userId', String(result.userId));

    return res.redirect(302, redirectUrl.toString());
  }

  // ApiSuccessResponse 사용 시 Swagger 번들에서
  //    'swagger_1 is not defined' 런타임 오류가 발생하여
  //    구글 엔드포인트만 표준 @ApiOkResponse로 표기합니다.
  @Public()
  @Public()
  @Get('google')
  @ApiOperation({ summary: '구글 로그인 URL 생성' })
  @ApiOkResponse({
    description: '구글 로그인 URL 생성 성공',
    type: GoogleLoginResponseDto,
  })
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
  @ApiOkResponse({
    description: '구글 로그인 성공',
    type: LoginCallbackResponseDto,
  })
  async googleLoginCallback(
    @Query('code') code: string,
  ): Promise<LoginCallbackResponseDto> {
    return await this.loginService.handleGoogleCallback(code);
  }
}
