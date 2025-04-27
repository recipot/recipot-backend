import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

import { AccessTokenPayload, RefreshTokenPayload } from './jwt.type';

import { ConfigService } from '@/config/config.service';
import { JwtToken } from './jwt.dto';

@Injectable()
export class JwtAuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * @author 김진태 <realbig419@keyclops.com>
   * @description Bearer 토큰에서 토큰값을 추출한다.
   */
  public extractBearer(bearerToken: string): string {
    const [, token] = bearerToken.split(' ');
    return token;
  }

  /**
   * @author 김진태 <realbig419@keyclops.com>
   * @description 토큰을 생성한다.
   */
  public async generateToken(
    accessPayload: AccessTokenPayload,
    refreshPayload: RefreshTokenPayload,
  ): Promise<JwtToken> {
    const accessSecret = this.config.get('jwt.accessSecret');
    const accessExpire = this.config.get('jwt.accessExpire');
    const refreshSecret = this.config.get('jwt.refreshSecret');
    const refreshExpire = this.config.get('jwt.refreshExpire');
    const algorithm = this.config.get('jwt.algorithm');

    const accessToken = await this.jwt.signAsync(accessPayload, {
      algorithm,
      secret: accessSecret,
      expiresIn: accessExpire,
    });

    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      algorithm,
      secret: refreshSecret,
      expiresIn: refreshExpire,
    });

    return {
      accessToken,
      refreshToken,
      accessExpire,
      refreshExpire,
    };
  }

  /**
   * @author 김진태 <realbig419@keyclops.com>
   * @description 페이로드를 구성한다.
   */
  public async generatePayload(
    userId: number,
    typ: string,
  ): Promise<AccessTokenPayload | RefreshTokenPayload> {
    return {
      sub: userId.toString(),
      aud: this.config.get('jwt.audience'),
      iss: this.config.get('jwt.issuer'),
      jti: uuidv4(),
      userId,
      typ,
    };
  }
}
