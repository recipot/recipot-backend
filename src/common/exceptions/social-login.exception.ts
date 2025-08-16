import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../constants/error-codes';

export class SocialLoginException extends HttpException {
  constructor(errorCode: keyof typeof ERROR_CODES, details?: string) {
    const error = ERROR_CODES[errorCode];
    super(
      {
        ...error,
        details: details || error.message,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class KakaoAuthException extends SocialLoginException {
  constructor(details?: string) {
    super('KAKAO_AUTH_FAILED', details);
  }
}

export class KakaoUserInfoException extends SocialLoginException {
  constructor(details?: string) {
    super('KAKAO_USER_INFO_FAILED', details);
  }
}

export class KakaoLogoutException extends SocialLoginException {
  constructor(details?: string) {
    super('KAKAO_LOGOUT_FAILED', details);
  }
}

export class KakaoUnlinkException extends SocialLoginException {
  constructor(details?: string) {
    super('KAKAO_UNLINK_FAILED', details);
  }
}
