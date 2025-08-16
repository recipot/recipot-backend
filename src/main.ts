import * as dotenv from 'dotenv-flow';
dotenv.config();

import { setupSwagger } from '@/common/swagger';
import { ConfigService } from '@/config/config.service';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from './app.module';

import { LoggerFactoryService } from '@/common/logger/logger-factory.service';
import { winstonConfig } from '@/common/logger/winston.config';
import dataSource from '@/database/data-source';
import { WinstonModule } from 'nest-winston';

async function bootstrap() {
  initializeTransactionalContext();

  const app = await NestFactory.create(AppModule);

  const loggerFactory = app.get(LoggerFactoryService);
  const logger = loggerFactory.create(bootstrap.name);

  const config = app.get(ConfigService);

  // API path version 명시
  app.enableVersioning({
    type: VersioningType.URI,
  });

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
    const seeder = new DatabaseSeeder(await dataSource);
    await seeder.run();
    logger.log(`✅ Seeding Successes.`);
  } catch (error) {
    logger.warn(`⚠️ Seeding failed: ${error.message}`);
  }

  logger.log(`✅ Migration Successes.`);

  const port = config.get<number>('HTTP_PORT');
  await app.listen(port);

  logger.log(
    `🚀 Server running on http://localhost:${port} 🌱 [env: ${process.env.ENV}]`,
  );
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
