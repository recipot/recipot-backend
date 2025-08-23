import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Module,
} from '@nestjs/common';

// Mock JWT Guard that always passes for testing
@Injectable()
export class MockJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // 인증 헤더가 없으면 false 반환 (403 Forbidden)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
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
