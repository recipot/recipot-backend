import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';

import { ERROR_CODES } from '@/common/constants/error-codes';
import { ConfigService } from '@/config/config.service';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: JwtStrategy.extractJwtFromCookieOrHeader,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
      passReqToCallback: true,
    });
  }

  /**
   * 쿠키에서 먼저 JWT를 추출하고, 없으면 Authorization 헤더에서 추출합니다.
   * BFF 패턴: 브라우저는 쿠키, 모바일/API는 Authorization 헤더 사용
   */
  private static extractJwtFromCookieOrHeader(request: Request): string | null {
    // 1. 쿠키에서 먼저 확인
    if (request.cookies && request.cookies.accessToken) {
      return request.cookies.accessToken;
    }

    // 2. Authorization 헤더에서 확인
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  async validate(request: Request, payload: any) {
    try {
      // 토큰에서 사용자 ID 추출
      const userId = parseInt(payload.sub);

      if (!userId) {
        throw new UnauthorizedException(ERROR_CODES.AUTH_INVALID_TOKEN.message);
      }

      // Redis에서 토큰 유효성 확인
      const token = JwtStrategy.extractJwtFromCookieOrHeader(request);
      if (!token) {
        throw new UnauthorizedException(
          ERROR_CODES.AUTH_TOKEN_NOT_PROVIDED.message,
        );
      }

      // JWT 서비스를 통해 토큰 검증
      const verifiedPayload = await this.authService.verifyAccessToken(token);

      // 검증된 페이로드 반환
      return {
        sub: parseInt(verifiedPayload.sub),
        role: payload.role,
        iat: verifiedPayload.iat,
        exp: verifiedPayload.exp,
      };
    } catch {
      throw new UnauthorizedException(
        ERROR_CODES.AUTH_TOKEN_INFO_FAILED.message,
      );
    }
  }
}
