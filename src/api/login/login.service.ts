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
import { Response } from 'express';
import * as qs from 'qs';
import { ERROR_CODES } from '../../common/constants/error-codes';
import { CustomException } from '../../common/exceptions/custom-exception';
import {
  GOOGLE_API,
  GOOGLE_API_URLS,
} from '@/common/constants/google-api.constants';

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
  async processKakaoLogin(code: string, res?: Response) {
    // 1) 인가 코드로 액세스 토큰 요청
    const tokenResponse = await this.getKakaoAccessToken(code);
    const kakaoUserInfo = await this.getKakaoUserInfo(
      tokenResponse.access_token,
    );

    const existingSocialLogin =
      await this.socialLoginService.findBySidAndPlatform(
        kakaoUserInfo.id.toString(),
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
      const newUser = await this.userService.createUser(
        kakaoUserInfo.kakao_account?.email,
      );

      await this.socialLoginService.createSocialLogin(
        newUser.id,
        kakaoUserInfo.id.toString(),
        'kakao',
      );

      // newUser를 userDto로 변환
      user = await this.userService.findById(newUser.id);
      if (!user) {
        throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
      }
    }

    const { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt } =
      await this.authService.generateSocialLoginTokens(user.id, user.role);

    if (res) {
      const isProduction = process.env.NODE_ENV === 'production';

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
        expires: new Date(accessExpiresAt as unknown as string),
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
        expires: new Date(refreshExpiresAt as unknown as string),
      });
    }

    return {
      userId: user.id,
      accessToken,
      refreshToken,
    };
  }

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

  generateGoogleLoginUrl(): string {
    const query = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? '',
      response_type: GOOGLE_API.RESPONSE_TYPE,
      scope: process.env.GOOGLE_SCOPE || GOOGLE_API.DEFAULTS.SCOPE,
      access_type: GOOGLE_API.DEFAULTS.ACCESS_TYPE,
      include_granted_scopes: GOOGLE_API.DEFAULTS.INCLUDE_GRANTED_SCOPES,
      prompt: GOOGLE_API.DEFAULTS.PROMPT,
    });
    return `${GOOGLE_API_URLS.AUTH_URL}?${query.toString()}`;
  }

  async handleGoogleCallback(code: string) {
    // 1) exchange code → tokens
    const tokens = await this.exchangeGoogleCodeForTokens(code);
    const accessToken = tokens?.access_token;
    if (!accessToken) {
      throw new CustomException(ERROR_CODES.GOOGLE_TOKEN_FAILED);
    }

    // 2) fetch profile
    const profile = await this.fetchGoogleProfile(accessToken);
    const sid = profile?.sub;
    if (!sid) {
      throw new CustomException(ERROR_CODES.GOOGLE_USER_INFO_FAILED);
    }

    // 3) locate or create user
    const user = await this.findOrCreateGoogleUser(sid, profile);

    // 4) issue tokens
    const jwt = await this.authService.generateSocialLoginTokens(user.id);

    return {
      userId: user.id,
      accessToken: jwt.accessToken,
      accessExpiresAt: jwt.accessExpiresAt,
      refreshToken: jwt.refreshToken,
      refreshExpiresAt: jwt.refreshExpiresAt,
    };
  }

  private async exchangeGoogleCodeForTokens(code: string) {
    try {
      const payload = qs.stringify({
        code,
        grant_type: 'authorization_code',
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      });

      const { data } = await axios.post(GOOGLE_API_URLS.TOKEN_URL, payload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      return data;
    } catch (e) {
      this.logger.error(
        `Google token fetch failed`,
        e?.response?.data || e.message,
      );
      throw new CustomException(ERROR_CODES.GOOGLE_TOKEN_FAILED);
    }
  }

  private async fetchGoogleProfile(accessToken: string) {
    try {
      const { data } = await axios.get(GOOGLE_API_URLS.USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!data?.sub) {
        this.logger.error(
          `Google profile missing sub: ${JSON.stringify(data)}`,
        );
        throw new CustomException(ERROR_CODES.GOOGLE_USER_INFO_FAILED);
      }

      return data;
    } catch (e) {
      this.logger.error(
        `Google profile fetch failed`,
        e?.response?.data || e.message,
      );
      throw new CustomException(ERROR_CODES.GOOGLE_USER_INFO_FAILED);
    }
  }

  private async findOrCreateGoogleUser(sid: string, profile: any) {
    const linked = await this.socialLoginService.findBySidAndPlatform(
      sid,
      'google',
    );

    if (linked) {
      const user = await this.userService.findById(linked.userId);
      if (!user) {
        throw new CustomException(ERROR_CODES.GOOGLE_AUTH_FAILED);
      }
      return user;
    }

    const email = profile?.email ?? `google_${sid}@placeholder.local`;
    const user = await this.userService.createUser(email);

    await this.socialLoginService.createSocialLogin(user.id, sid, 'google');
    return user;
  }
}