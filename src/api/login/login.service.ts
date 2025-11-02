import { AuthService } from '@/api/auth/auth.service';
import { SocialLoginService } from '@/api/social-login/social-login.service';
import { UserService } from '@/api/user/user.service';
import { ERROR_CODES } from '@/common/constants/error-codes';
import {
  GOOGLE_API,
  GOOGLE_API_URLS,
} from '@/common/constants/google-api.constants';
import {
  KAKAO_API,
  KAKAO_API_URLS,
} from '@/common/constants/kakao-api.constants';
import { CustomException } from '@/common/exceptions/custom-exception';
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';
import * as qs from 'qs';

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  constructor(
    private readonly authService: AuthService,
    private readonly socialLoginService: SocialLoginService,
    private readonly userService: UserService,
  ) {}

  /** 카카오 로그인 URL 생성 (환경변수 누락 시 즉시 실패) */
  generateKakaoLoginUrl(): string {
    const clientId = process.env.KAKAO_CLIENT_ID;
    const redirectUri = process.env.KAKAO_REDIRECT_URI;
    if (!clientId || !redirectUri) {
      this.logger.error(
        'Kakao OAuth config is missing clientId or redirectUri',
      );
      throw new CustomException(ERROR_CODES.KAKAO_CONFIG_ERROR);
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: KAKAO_API.RESPONSE_TYPE,
      scope: KAKAO_API.SCOPE,
    });
    return `${KAKAO_API_URLS.AUTH_URL}?${params.toString()}`;
  }

  /** 카카오 콜백 처리 */
  async handleKakaoCallback(code: string, res?: Response) {
    // 1) code → tokens
    const tokenResponse = await this.exchangeKakaoCodeForTokens(code);
    const accessToken = tokenResponse.access_token;
    if (!accessToken) {
      throw new CustomException(ERROR_CODES.KAKAO_TOKEN_FAILED);
    }

    // 2) get profile
    const profile = await this.fetchKakaoProfile(accessToken);
    const sid = profile?.id?.toString();
    if (!sid) {
      throw new CustomException(ERROR_CODES.KAKAO_USER_INFO_FAILED);
    }

    // 3) find or create user
    const user = await this.findOrCreateKakaoUser(sid, profile);

    // 4) issue app JWTs (role required)
    const jwt = await this.authService.generateSocialLoginTokens(
      user.id,
      user.role,
    );

    // 5) 쿠키에 토큰 저장
    if (res) {
      const isProduction = process.env.NODE_ENV === 'production';
      const domain = process.env.BASE_DOMAIN;

      res.cookie('accessToken', jwt.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
        domain: isProduction ? domain : undefined,
        expires: new Date(jwt.accessExpiresAt as unknown as string),
      });

      res.cookie('refreshToken', jwt.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
        domain: isProduction ? domain : undefined,
        expires: new Date(jwt.refreshExpiresAt as unknown as string),
      });
    }

    return {
      userId: user.id,
    };
  }

  /** code → Kakao tokens (환경변수 누락 시 즉시 실패) */
  private async exchangeKakaoCodeForTokens(code: string) {
    const clientId = process.env.KAKAO_CLIENT_ID;
    const clientSecret = process.env.KAKAO_CLIENT_SECRET;
    const redirectUri = process.env.KAKAO_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) {
      this.logger.error(
        'Kakao OAuth config is missing clientId/clientSecret/redirectUri',
      );
      throw new CustomException(ERROR_CODES.KAKAO_CONFIG_ERROR);
    }

    try {
      const tokenParams = qs.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
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
        throw new CustomException(ERROR_CODES.KAKAO_TOKEN_FAILED);
      }

      return response.data;
    } catch (e: any) {
      this.logger.error(
        'Kakao token fetch failed',
        e?.response?.data || e?.message,
      );
      throw new CustomException(ERROR_CODES.KAKAO_TOKEN_FAILED);
    }
  }

  /** accessToken → Kakao profile */
  private async fetchKakaoProfile(accessToken: string) {
    try {
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
    } catch (e: any) {
      this.logger.error(
        'Kakao profile fetch failed',
        e?.response?.data || e?.message,
      );
      throw new CustomException(ERROR_CODES.KAKAO_USER_INFO_FAILED);
    }
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
  async handleGoogleCallback(code: string, res?: Response) {
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

    // 5) 쿠키에 토큰 저장
    if (res) {
      const isProduction = process.env.NODE_ENV === 'production';
      const domain = process.env.BASE_DOMAIN;

      res.cookie('accessToken', jwt.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
        domain: isProduction ? domain : undefined,
        expires: new Date(jwt.accessExpiresAt as unknown as string),
      });

      res.cookie('refreshToken', jwt.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
        domain: isProduction ? domain : undefined,
        expires: new Date(jwt.refreshExpiresAt as unknown as string),
      });
    }

    return {
      userId: user.id,
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
  private async findOrCreateKakaoUser(sid: string, profile: any) {
    const linked = await this.socialLoginService.findBySidAndPlatform(
      sid,
      'kakao',
    );

    if (linked) {
      const user = await this.userService.findById(linked.userId);
      if (!user) {
        throw new CustomException(ERROR_CODES.KAKAO_AUTH_FAILED);
      }
      return user;
    }

    const email = profile?.kakao_account?.email;
    if (!email) {
      this.logger.error('Kakao profile missing email');
      throw new CustomException(ERROR_CODES.KAKAO_EMAIL_REQUIRED);
    }

    const user = await this.userService.createUser(email);

    await this.socialLoginService.createSocialLogin(user.id, sid, 'kakao');
    return user;
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

    const email = profile?.email;
    if (!email) {
      this.logger.error('Google profile missing email');
      throw new CustomException(ERROR_CODES.GOOGLE_EMAIL_REQUIRED);
    }

    const user = await this.userService.createUser(email);

    await this.socialLoginService.createSocialLogin(user.id, sid, 'google');
    return user;
  }

  /**
   * 로그인 콜백 URL을 생성합니다.
   * @param userId 사용자 ID
   * @returns 리다이렉트 URL
   */
  buildLoginCallbackUrl(userId: number): string {
    const callbackUrl = process.env.FRONTEND_LOGIN_CALLBACK_URL;
    if (!callbackUrl) {
      this.logger.error('FRONTEND_LOGIN_CALLBACK_URL is not defined');
      throw new CustomException(ERROR_CODES.CONFIG_ERROR);
    }
    return callbackUrl.replace('{userId}', userId.toString());
  }
}
