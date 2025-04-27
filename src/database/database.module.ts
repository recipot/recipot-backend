import { ConfigService } from '@/config/config.service';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database.service';
import { UserEntity } from './entity/user.entity';
import { SocialLoginEntity } from './entity/social-login.entity';
import { DataSource } from 'typeorm';
import { BoardEntity } from '@/database/entity/board.entity';
import { addTransactionalDataSource } from 'typeorm-transactional';
import * as path from 'path'; // 경로를 위해 'path' 모듈을 임포트
import { LoginEntity } from './entity/login.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async () => ({
        type: process.env.DB_TYPE as 'mysql',
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        synchronize: false,
        entities: [path.join(__dirname, 'entity', '*.entity.{ts,js}')],
        migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
        migrationsRun: true,
        migrationsTableName: 'migrations_history',
        // logging: true, // 트랜잭션 확인용
      }),
      dataSourceFactory: async (options) => {
        const dataSource = new DataSource(options);
        await dataSource.initialize();
        return addTransactionalDataSource(dataSource);
      },
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      LoginEntity,
      SocialLoginEntity,
      BoardEntity,
    ]),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService, TypeOrmModule],
})
export class DatabaseModule {}
