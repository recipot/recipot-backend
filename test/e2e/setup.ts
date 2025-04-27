import 'tsconfig-paths/register';
import { AppModule } from '@/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

export default async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app: INestApplication = moduleFixture.createNestApplication();

  app.useGlobalPipes(new ValidationPipe());

  await app.close();
};
