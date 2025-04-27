import { Request } from 'express';

export class TokenPayloadBase {
  public iss: string;
  public sub: string;
  public aud: string;
  public jti: string;
  public typ: string;
  public userId: number;
}

export class AccessTokenPayload extends TokenPayloadBase {}

export class RefreshTokenPayload extends TokenPayloadBase {}

export interface RequestWithUser extends Request {
  user: AccessTokenPayload;
}

export const TokenType = {
  Access: 'access',
  Refresh: 'refresh',
} as const;
export type TokenType = (typeof TokenType)[keyof typeof TokenType];
