import { AuthService } from '@/api/auth/auth.service';
import { SocialLoginService } from '@/api/social-login/social-login.service';
import { UserDto } from '@/api/user/dto/user.dto';
import { UserService } from '@/api/user/user.service';
import {
  KAKAO_API,
  KAKAO_API_URLS,
} from '@/common/constants/kakao-api.constants';
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as qs from 'qs';
import { ERROR_CODES } from '../../common/constants/error-codes';
import { CustomException } from '../../common/exceptions/custom-exception';

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  constructor(
    private readonly authService: AuthService,
    private readonly socialLoginService: SocialLoginService,
    private readonly userService: UserService,
  ) {}

  /**
   * 카카오 로그인 URL을 생성합니다.
   */
  generateKakaoLoginUrl(): string {
    const params = new URLSearchParams({
      client_id: process.env.KAKAO_CLIENT_ID,
      redirect_uri: process.env.KAKAO_REDIRECT_URI,
      response_type: KAKAO_API.RESPONSE_TYPE,
      scope: KAKAO_API.SCOPE,
    });

    return `${KAKAO_API_URLS.AUTH_URL}?${params.toString()}`;
  }

  /**
   * 카카오 로그인을 처리합니다.
   */
  async processKakaoLogin(code: string) {
    // 1. 인가 코드로 액세스 토큰 요청
    const tokenResponse = await this.getKakaoAccessToken(code);

    // 2. 액세스 토큰으로 사용자 정보 조회
    const kakaoUserInfo = await this.getKakaoUserInfo(
      tokenResponse.access_token,
    );

    // 3. 기존 소셜 로그인 정보 확인
    const existingSocialLogin =
      await this.socialLoginService.findBySidAndPlatform(
        kakaoUserInfo.id.toString(),
        // TODO 공통코드 처리
        'kakao',
      );

    let user: UserDto;

    if (existingSocialLogin) {
      // 기존 사용자: 기존 유저 정보 조회
      user = await this.userService.findById(existingSocialLogin.userId);
      if (!user) {
        throw new Error('User not found');
      }
    } else {
      // 신규 사용자: 유저 생성
      user = await this.userService.createUser(
        kakaoUserInfo.kakao_account?.email,
      );

      // 소셜 로그인 정보 생성
      await this.socialLoginService.createSocialLogin(
        user.id,
        kakaoUserInfo.id.toString(),
        // TODO 공통코드 처리
        'kakao',
      );
    }

    // 4. JWT 토큰 생성 (Access Token + Refresh Token)
    const { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt } =
      await this.authService.generateSocialLoginTokens(user.id, user.role);

    return {
      userId: user.id,
      accessToken,
      accessExpiresAt,
      refreshToken,
      refreshExpiresAt,
    };
  }

  /**
   * 카카오 인가 코드로 액세스 토큰을 요청합니다.
   */
  async getKakaoAccessToken(code: string): Promise<any> {
    const tokenParams = qs.stringify({
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_CLIENT_ID,
      client_secret: process.env.KAKAO_CLIENT_SECRET,
      redirect_uri: process.env.KAKAO_REDIRECT_URI,
      code: code,
    });

    const response = await axios.post<any>(
      KAKAO_API_URLS.TOKEN_URL,
      tokenParams,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    if (!response || !response.data) {
      throw new CustomException(ERROR_CODES.AUTH_TOKEN_EXPIRED);
    }

    return response.data;
  }

  /**
   * 카카오 액세스 토큰으로 사용자 정보를 조회합니다.
   */
  async getKakaoUserInfo(accessToken: string): Promise<any> {
    const response = await axios.get<any>(KAKAO_API_URLS.USER_ME_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response || !response.data) {
      throw new CustomException(ERROR_CODES.KAKAO_USER_INFO_FAILED);
    }

    return response.data;
  }
}
