import { UserEntity } from './entity/user.entity';
import * as bcrypt from 'bcrypt';
import dataSource from './data-source';
import { CustomLoggerService } from '@/common/logger/custom-logger.service';
import { winstonConfig } from '@/common/logger/winston.config';
import winston from 'winston';
import { LoginEntity } from './entity/login.entity';

const loggerInstance = winston.createLogger(winstonConfig);
const logger = new CustomLoggerService(loggerInstance).setContext('Seeder');

export async function seed() {
  try {
    await (await dataSource).initialize();

    const loginRepository = (await dataSource).getRepository(LoginEntity);
    const userRepository = (await dataSource).getRepository(UserEntity);

    const existingAdmin = await loginRepository.findOne({
      where: { passid: 'admin' },
    });

    if (existingAdmin) {
      logger.log('Admin user already exists. Skipping seed.');
      return;
    }

    const hashedPassword = await bcrypt.hash('recipot1!11', 10);

    const login = loginRepository.create({
      passid: 'admin',
      password: hashedPassword,
    });
    await loginRepository.save(login);

    const adminUser = userRepository.create({
      nickName: 'admin',
      cookingLevel: 'admin',
      householdType: 'admin',
      job: 'admin',
      login: login,
    });
    await userRepository.save(adminUser);

    logger.log('Admin user created successfully.');
  } catch (error) {
    logger.error('Failed to seed admin user', error.stack);
  } finally {
    await (await dataSource).destroy();
  }
}
