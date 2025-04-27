import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { ConfigService } from '@/config/config.service';
import { TokenType } from './jwt.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (request: Request, rawJwtToken: string, done) => {
        try {
          const decodedToken: any = JSON.parse(
            Buffer.from(rawJwtToken.split('.')[1], 'base64').toString(),
          );

          const isRefreshToken = decodedToken.typ === TokenType.Refresh;

          const secret = isRefreshToken
            ? this.config.get('jwt.refreshSecret')
            : this.config.get('jwt.accessSecret');

          done(null, secret);
        } catch (err) {
          done(err, null);
        }
      },
    });
  }

  async validate(payload: any) {
    return payload;
  }
}
