import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { CacheService } from '@/common/cache/cache.service';
import { parseExpireTime } from '@/common/utils/time.util';

@Injectable()
export class JwtAuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * 소셜 로그인 사용자를 위한 간단한 JWT 토큰 생성
   */
  public async generateSocialLoginToken(
    userId: number,
    email: string,
    nickname: string,
  ): Promise<string> {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const accessExpire = process.env.JWT_ACCESS_EXPIRE;
    const algorithm = process.env.JWT_ALGORITHM as any;

    const payload = {
      sub: userId.toString(),
      email,
      nickname,
    };

    const token = this.jwt.sign(payload, {
      algorithm,
      secret: accessSecret,
      expiresIn: accessExpire,
    });

    // Redis에 토큰 저장
    await this.saveTokenToRedis(userId, token, accessExpire);

    return token;
  }

  /**
   * 토큰을 Redis에 저장
   */
  private async saveTokenToRedis(
    userId: number,
    token: string,
    expireTime: string,
  ): Promise<void> {
    const key = `token:${userId}`;
    const expireSeconds = parseExpireTime(expireTime);

    await this.cacheService.set(key, token, expireSeconds);
  }
}
