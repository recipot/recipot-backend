import * as dotenv from 'dotenv-flow';
dotenv.config();

import { setupSwagger } from '@/common/swagger';
import { ConfigService } from '@/config/config.service';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { JwtGuard } from './api/auth/guards/auth.guard';
import { AppModule } from './app.module';

import { LoggerFactoryService } from '@/common/logger/logger-factory.service';
import { winstonConfig } from '@/common/logger/winston.config';
import dataSource from '@/database/data-source';
import cookieParser from 'cookie-parser';
import { WinstonModule } from 'nest-winston';

async function bootstrap() {
  // API_DOMAIN 환경 변수 필수 체크
  if (!process.env.API_DOMAIN) {
    console.error('❌ API_DOMAIN environment variable is required');
    process.exit(1);
  }

  initializeTransactionalContext();

  const app = await NestFactory.create(AppModule);

  const loggerFactory = app.get(LoggerFactoryService);
  const logger = loggerFactory.create(bootstrap.name);

  const config = app.get(ConfigService);

  // Cookie Parser 설정 (BFF 패턴: 쿠키 기반 JWT 인증 지원)
  app.use(cookieParser());

  // CORS 설정 추가
  const frontendUrls =
    config.get<string>('frontendUrl.urls') || process.env.FRONTEND_URL;
  const allowedOrigins = frontendUrls
    ? frontendUrls.split(',').map((url) => url.trim())
    : ['http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-Session'],
  });
  logger.log(`CORS enabled for: ${allowedOrigins.join(', ')}`);

  // 전역 가드 설정 - Reflector를 app.get()으로 가져옴
  const reflector = app.get('Reflector');
  app.useGlobalGuards(new JwtGuard(reflector));

  // 버전 관리 활성화 - 컨트롤러의 version 옵션 사용
  app.enableVersioning();

  // DTO validation check 활성화
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  setupSwagger(app);

  // DB Migration init
  initializeTransactionalContext();
  if (!(await dataSource).isInitialized) {
    await (await dataSource).initialize();
  }
  await (await dataSource).runMigrations();

  // Seeder 실행
  try {
    const { DatabaseSeeder } = await import('./database/seeds');
    const seeder = new DatabaseSeeder(await dataSource, logger);
    await seeder.run();
    logger.log(`✅ Seeding Successes.`);
  } catch (error) {
    logger.warn(`⚠️ Seeding failed: ${error.message}`);
  }

  logger.log(`✅ Migration Successes.`);

  const port = config.get<number>('HTTP_PORT');
  await app.listen(port);

  const env = process.env.ENV || process.env.NODE_ENV || 'local';
  logger.log(`🚀 Server running on http://localhost:${port} 🌱 [env: ${env}]`);
}

bootstrap().catch((err) => {
  // bootstrap 실패 시 app이 초기화되지 않은 상태로, LoggerFactoryService 사용 불가
  const fallbackLogger = WinstonModule.createLogger(winstonConfig);
  fallbackLogger.error('❌ Failed to bootstrap the app', {
    stack: err.stack,
    context: 'Bootstrap',
  });
  process.exit(1);
});
