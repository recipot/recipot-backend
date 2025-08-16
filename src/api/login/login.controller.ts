import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { KakaoLoginResponseDto } from './dto/kakao-login.response.dto';
import { LoginCallbackResponseDto } from './dto/login-callback-response.dto';
import { LoginService } from './login.service';

@ApiTags('로그인')
@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Get('kakao')
  @ApiOperation({
    summary: '카카오 로그인 URL 생성',
    description: '카카오 로그인을 위한 인증 URL을 생성합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '카카오 로그인 URL 생성 성공',
    type: KakaoLoginResponseDto,
  })
  generateKakaoLoginUrl(): KakaoLoginResponseDto {
    const loginUrl = this.loginService.generateKakaoLoginUrl();
    return { loginUrl };
  }

  @Get('kakao/callback')
  @ApiOperation({
    summary: '카카오 로그인 콜백 처리',
    description: '카카오 인증 후 받은 인가 코드로 로그인을 처리합니다.',
  })
  @ApiQuery({
    name: 'code',
    required: true,
    description: '카카오에서 받은 인가 코드',
  })
  @ApiResponse({
    status: 200,
    description: '카카오 로그인 성공',
    type: LoginCallbackResponseDto,
  })
  async kakaoLoginCallback(@Query('code') code: string) {
    return await this.loginService.processKakaoLogin(code);
  }
}
