import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import 'tsconfig-paths/register';
import { MockAppModule } from '../mocks/app.mock';

export default async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [MockAppModule],
  }).compile();

  const app: INestApplication = moduleFixture.createNestApplication();

  app.useGlobalPipes(new ValidationPipe());

  await app.close();
};
