import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

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
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.accessToken ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: any) {
    try {
      // 토큰에서 사용자 ID 추출
      const userId = parseInt(payload.sub);

      if (!userId) {
        throw new UnauthorizedException(ERROR_CODES.AUTH_INVALID_TOKEN.message);
      }

      // Redis에서 토큰 유효성 확인
      const token = this.extractTokenFromRequest(request);
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

  private extractTokenFromRequest(request: Request): string | null {
    const cookieToken = request.cookies?.accessToken;
    if (cookieToken) {
      return cookieToken;
    }

    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }

    return null;
  }
}
