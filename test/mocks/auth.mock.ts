import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Module,
  UnauthorizedException,
} from '@nestjs/common';

// Mock JWT Guard that always passes for testing
@Injectable()
export class MockJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // 인증 헤더가 없으면 401 Unauthorized 예외 발생
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('인증이 필요합니다.');
    }

    // 인증 헤더가 있으면 mock user 설정
    request.user = { sub: 1 };
    return true;
  }
}

@Module({
  providers: [MockJwtGuard],
  exports: [MockJwtGuard],
})
export class MockAuthModule {}
