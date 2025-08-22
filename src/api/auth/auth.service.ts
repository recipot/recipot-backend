import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { CacheService } from '@/common/cache/cache.service';
import { CONSTANTS } from '@/common/constants/constants';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { secondsToJwtFormat } from '@/common/utils/time.util';
import { CustomException } from '@/common/exceptions/custom-exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * 소셜 로그인 사용자를 위한 Access Token과 Refresh Token 생성
   */
  public async generateSocialLoginTokens(userId: number): Promise<{
    accessToken: string;
    refreshToken: string;
    accessExpiresAt: string;
    refreshExpiresAt: string;
  }> {
    const accessToken = await this.generateAccessToken(userId);
    const refreshToken = await this.generateRefreshToken(userId);

    // 만료 시간 계산
    const accessExpire = parseInt(process.env.JWT_ACCESS_EXPIRE);
    const refreshExpire = parseInt(process.env.JWT_REFRESH_EXPIRE);

    const now = new Date();
    const accessExpiresAt = new Date(
      now.getTime() + accessExpire * 1000,
    ).toISOString();
    const refreshExpiresAt = new Date(
      now.getTime() + refreshExpire * 1000,
    ).toISOString();

    return { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt };
  }

  /**
   * Access Token 생성
   */
  public async generateAccessToken(userId: number): Promise<string> {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const accessExpire = process.env.JWT_ACCESS_EXPIRE;
    const algorithm = process.env.JWT_ALGORITHM as any;

    const payload = {
      sub: userId.toString(),
      type: 'access',
    };

    const token = this.jwt.sign(payload, {
      algorithm,
      secret: accessSecret,
      expiresIn: secondsToJwtFormat(parseInt(accessExpire)),
    });

    // Redis에 Access Token 저장
    await this.saveAccessTokenToRedis(userId, token, accessExpire);

    return token;
  }

  /**
   * Refresh Token 생성
   */
  public async generateRefreshToken(userId: number): Promise<string> {
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    const refreshExpire = process.env.JWT_REFRESH_EXPIRE;
    const algorithm = process.env.JWT_ALGORITHM as any;

    const payload = {
      sub: userId.toString(),
      type: 'refresh',
    };

    const token = this.jwt.sign(payload, {
      algorithm,
      secret: refreshSecret,
      expiresIn: secondsToJwtFormat(parseInt(refreshExpire)),
    });

    // Redis에 Refresh Token 저장
    await this.saveRefreshTokenToRedis(userId, token, refreshExpire);

    return token;
  }

  /**
   * Refresh Token으로 새로운 Access Token 발급
   */
  public async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    accessExpiresAt: string;
    refreshExpiresAt: string;
  }> {
    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET;

      // Refresh Token 검증
      const payload = this.jwt.verify(refreshToken, {
        secret: refreshSecret,
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException(
          ERROR_CODES.AUTH_INVALID_REFRESH_TOKEN.message,
        );
      }

      const userId = parseInt(payload.sub);

      // Redis에서 Refresh Token 유효성 확인
      const isValidRefreshToken = await this.validateRefreshTokenInRedis(
        userId,
        refreshToken,
      );
      if (!isValidRefreshToken) {
        throw new UnauthorizedException(
          ERROR_CODES.AUTH_REFRESH_TOKEN_NOT_IN_REDIS.message,
        );
      }

      // 새로운 토큰 쌍 생성
      const newAccessToken = await this.generateAccessToken(userId);
      const newRefreshToken = await this.generateRefreshToken(userId);

      // 기존 Refresh Token 제거
      await this.removeRefreshTokenFromRedis(userId);

      // 토큰 만료시간 조회
      const accessTokenInfo = await this.getTokenExpiration(newAccessToken);
      const refreshTokenInfo = await this.getTokenExpiration(newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        accessExpiresAt: accessTokenInfo.expiresAt.toISOString(),
        refreshExpiresAt: refreshTokenInfo.expiresAt.toISOString(),
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException(
          ERROR_CODES.AUTH_REFRESH_TOKEN_EXPIRED.message,
        );
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException(
          ERROR_CODES.AUTH_INVALID_REFRESH_TOKEN.message,
        );
      }
      throw error;
    }
  }

  /**
   * Access Token 검증
   */
  public async verifyAccessToken(token: string): Promise<any> {
    try {
      const accessSecret = process.env.JWT_ACCESS_SECRET;
      const payload = this.jwt.verify(token, {
        secret: accessSecret,
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException(
          ERROR_CODES.AUTH_INVALID_ACCESS_TOKEN.message,
        );
      }

      // Redis에서 토큰 유효성 확인
      const isValid = await this.validateAccessTokenInRedis(payload.sub, token);
      if (!isValid) {
        throw new UnauthorizedException(
          ERROR_CODES.AUTH_ACCESS_TOKEN_NOT_IN_REDIS.message,
        );
      }

      return payload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException(ERROR_CODES.AUTH_TOKEN_EXPIRED.message);
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException(ERROR_CODES.AUTH_INVALID_TOKEN.message);
      }
      throw error;
    }
  }

  /**
   * Access Token을 Redis에 저장
   */
  private async saveAccessTokenToRedis(
    userId: number,
    token: string,
    expireTime: string,
  ): Promise<void> {
    const key = `${CONSTANTS.ACCESS_TOKEN_PREFIX}:${userId}`;
    // JWT_EXPIRE는 초 단위이므로 밀리초로 변환 (초 * 1000)
    const expireMilliseconds = parseInt(expireTime) * 1000;
    await this.cacheService.set(key, token, expireMilliseconds);
  }

  /**
   * Refresh Token을 Redis에 저장
   */
  private async saveRefreshTokenToRedis(
    userId: number,
    token: string,
    expireTime: string,
  ): Promise<void> {
    const key = `${CONSTANTS.REFRESH_TOKEN_PREFIX}:${userId}`;
    const expireMilliseconds = parseInt(expireTime) * 1000;
    await this.cacheService.set(key, token, expireMilliseconds);
  }

  /**
   * Redis에서 Access Token 유효성 확인
   */
  private async validateAccessTokenInRedis(
    userId: string,
    token: string,
  ): Promise<boolean> {
    const key = `${CONSTANTS.ACCESS_TOKEN_PREFIX}:${userId}`;
    const storedToken = await this.cacheService.get(key);
    return storedToken === token;
  }

  /**
   * Redis에서 Refresh Token 유효성 확인
   */
  private async validateRefreshTokenInRedis(
    userId: number,
    token: string,
  ): Promise<boolean> {
    const key = `${CONSTANTS.REFRESH_TOKEN_PREFIX}:${userId}`;
    const storedToken = await this.cacheService.get(key);
    return storedToken === token;
  }

  /**
   * Redis에서 Access Token 제거
   */
  private async removeAccessTokenFromRedis(userId: number): Promise<void> {
    const key = `${CONSTANTS.ACCESS_TOKEN_PREFIX}:${userId}`;
    await this.cacheService.del(key);
  }

  /**
   * Redis에서 Refresh Token 제거
   */
  private async removeRefreshTokenFromRedis(userId: number): Promise<void> {
    const key = `${CONSTANTS.REFRESH_TOKEN_PREFIX}:${userId}`;
    await this.cacheService.del(key);
  }

  /**
   * 토큰 만료 시간 확인
   */
  public async getTokenExpiration(
    token: string,
  ): Promise<{ expiresAt: Date; isExpired: boolean }> {
    const decoded = this.jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      throw new BadRequestException(
        ERROR_CODES.AUTH_TOKEN_DECODE_FAILED.message,
      );
    }

    const expiresAt = new Date(decoded.exp * 1000);
    const now = new Date();
    const isExpired = now >= expiresAt;

    return { expiresAt, isExpired };
  }

  /**
   * 사용자 ID로 토큰 정보 조회
   */
  public async getTokenInfo(userId: number): Promise<{
    accessToken: string;
    refreshToken: string;
    accessExpiresAt: string;
    refreshExpiresAt: string;
  } | null> {
    const accessTokenKey = `${CONSTANTS.ACCESS_TOKEN_PREFIX}:${userId}`;
    const refreshTokenKey = `${CONSTANTS.REFRESH_TOKEN_PREFIX}:${userId}`;

    const accessToken = await this.cacheService.get(accessTokenKey);
    const refreshToken = await this.cacheService.get(refreshTokenKey);

    if (!accessToken || !refreshToken) {
      return null;
    }

    const accessTokenInfo = await this.getTokenExpiration(accessToken);
    const refreshTokenInfo = await this.getTokenExpiration(refreshToken);

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      accessExpiresAt: accessTokenInfo.expiresAt.toISOString(),
      refreshExpiresAt: refreshTokenInfo.expiresAt.toISOString(),
    };
  }

  /**
   * 토큰 검증 결과 반환 (컨트롤러 반환용)
   */
  public async verifyToken(
    token: string,
  ): Promise<{ isValid: boolean; isExpired: boolean; expiresAt: Date }> {
    try {
      // 토큰 검증 및 payload 반환
      const payload = await this.verifyAccessToken(token);

      // payload에서 만료 시간 추출
      const expiresAt = new Date(payload.exp * 1000);
      const isExpired = new Date() >= expiresAt;

      return {
        isValid: true,
        isExpired,
        expiresAt,
      };
    } catch {
      return {
        isValid: false,
        isExpired: true,
        expiresAt: new Date(),
      };
    }
  }

  /**
   * 디버그용 토큰 생성 (컨트롤러용)
   */
  public async generateDebugToken(userId: number): Promise<{
    accessToken: string;
    refreshToken: string;
    accessExpiresAt: string;
    refreshExpiresAt: string;
  }> {
    const accessToken = await this.generateAccessToken(userId);
    const refreshToken = await this.generateRefreshToken(userId);

    // 토큰 만료 시간 계산
    const accessTokenInfo = await this.getTokenExpiration(accessToken);
    const refreshTokenInfo = await this.getTokenExpiration(refreshToken);

    return {
      accessToken,
      refreshToken,
      accessExpiresAt: accessTokenInfo.expiresAt.toISOString(),
      refreshExpiresAt: refreshTokenInfo.expiresAt.toISOString(),
    };
  }

  public async logout(accessToken: string): Promise<{ ok: true }> {
    try {
      const accessSecret = process.env.JWT_ACCESS_SECRET;

      let payload: any;
      try {
        payload = this.jwt.verify(accessToken, { secret: accessSecret });
      } catch (err: any) {
        if (err?.name === 'TokenExpiredError') {
          const decoded = this.jwt.decode(accessToken) as any;
          if (!decoded?.sub) {
            throw new CustomException(ERROR_CODES.AUTH_INVALID_TOKEN);
          }
          payload = decoded;
        } else {
          throw new CustomException(ERROR_CODES.AUTH_INVALID_TOKEN);
        }
      }

      const userId = parseInt(payload.sub);

      try {
        await this.removeAccessTokenFromRedis(userId);
      } catch {
        throw new CustomException(ERROR_CODES.ACCESS_BLACKLIST_FAILED);
      }

      try {
        await this.removeRefreshTokenFromRedis(userId);
      } catch {
        throw new CustomException(ERROR_CODES.REFRESH_REVOKE_FAILED);
      }

      return { ok: true };
    } catch (e) {
      if (e instanceof CustomException) {
        throw e;
      }
      throw new CustomException(ERROR_CODES.LOGOUT_FAILED);
    }
  }
}
