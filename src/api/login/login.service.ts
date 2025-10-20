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
import { ERROR_CODES } from '@/common/constants/error-codes';
import { CustomException } from '@/common/exceptions/custom-exception';
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
      const newUser = await this.userService.createUser(
        kakaoUserInfo.kakao_account?.email,
      );

      // 소셜 로그인 정보 생성
      await this.socialLoginService.createSocialLogin(
        newUser.id,
        kakaoUserInfo.id.toString(),
        // TODO 공통코드 처리
        'kakao',
      );

      // newUser를 userDto로 변환
      user = await this.userService.findById(newUser.id);
      if (!user) {
        throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
      }
    }

    // 4. JWT 토큰 생성 (Access Token + Refresh Token)
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

  /** 구글 로그인 URL 생성 (환경변수 누락 시 즉시 실패) */
  generateGoogleLoginUrl(): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !redirectUri) {
      this.logger.error(
        'Google OAuth config is missing clientId or redirectUri',
      );
      throw new CustomException(ERROR_CODES.GOOGLE_CONFIG_ERROR);
    }
    const scope = process.env.GOOGLE_SCOPE || GOOGLE_API.DEFAULTS.SCOPE;

    const query = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: GOOGLE_API.RESPONSE_TYPE,
      scope,
      access_type: GOOGLE_API.DEFAULTS.ACCESS_TYPE,
      include_granted_scopes: GOOGLE_API.DEFAULTS.INCLUDE_GRANTED_SCOPES,
      prompt: GOOGLE_API.DEFAULTS.PROMPT,
    });
    return `${GOOGLE_API_URLS.AUTH_URL}?${query.toString()}`;
  }

  /** 구글 콜백 처리 */
  async handleGoogleCallback(code: string) {
    // 1) code → tokens
    const tokens = await this.exchangeGoogleCodeForTokens(code);
    const accessToken = tokens?.access_token;
    if (!accessToken) {
      throw new CustomException(ERROR_CODES.GOOGLE_TOKEN_FAILED);
    }

    // 2) get profile
    const profile = await this.fetchGoogleProfile(accessToken);
    const sid = profile?.sub;
    if (!sid) {
      throw new CustomException(ERROR_CODES.GOOGLE_USER_INFO_FAILED);
    }

    // 3) find or create user
    const user = await this.findOrCreateGoogleUser(sid, profile);

    // 4) issue app JWTs (role required)
    const jwt = await this.authService.generateSocialLoginTokens(
      user.id,
      user.role,
    );

    return {
      userId: user.id,
      accessToken: jwt.accessToken,
      accessExpiresAt: jwt.accessExpiresAt,
      refreshToken: jwt.refreshToken,
      refreshExpiresAt: jwt.refreshExpiresAt,
    };
  }

  /** code → Google tokens (환경변수 누락 시 즉시 실패) */
  private async exchangeGoogleCodeForTokens(code: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) {
      this.logger.error(
        'Google OAuth config is missing clientId/clientSecret/redirectUri',
      );
      throw new CustomException(ERROR_CODES.GOOGLE_CONFIG_ERROR);
    }

    try {
      const payload = qs.stringify({
        code,
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      });

      const { data } = await axios.post(GOOGLE_API_URLS.TOKEN_URL, payload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      return data;
    } catch (e: any) {
      this.logger.error(
        'Google token fetch failed',
        e?.response?.data || e?.message,
      );
      throw new CustomException(ERROR_CODES.GOOGLE_TOKEN_FAILED);
    }
  }

  /** accessToken → Google profile */
  private async fetchGoogleProfile(accessToken: string) {
    try {
      const { data } = await axios.get(GOOGLE_API_URLS.USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!data?.sub) {
        this.logger.error('Google profile missing sub');
        throw new CustomException(ERROR_CODES.GOOGLE_USER_INFO_FAILED);
      }

      return data;
    } catch (e: any) {
      this.logger.error(
        'Google profile fetch failed',
        e?.response?.data || e?.message,
      );
      throw new CustomException(ERROR_CODES.GOOGLE_USER_INFO_FAILED);
    }
  }

  /** 소셜 연결 조회 후 사용자 생성/반환 */
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
