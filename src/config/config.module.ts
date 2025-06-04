import { Module } from '@nestjs/common';
import { loadConfig } from '@/config/config.loader';
import { ConfigService } from '@/config/config.service';
import { ConfigModuleOptions } from '@nestjs/config';

const ENV = process.env.NODE_ENV || 'development';

@Module({})
export class ConfigModule {
  public static forRootAsync(options: ConfigModuleOptions = {}) {
    const provider = {
      provide: ConfigService,
      useFactory: async () => {
        const config = await loadConfig(process.env);
        return new ConfigService(config);
      },
    };

    return {
      global: options.isGlobal,
      module: ConfigModule,
      providers: [provider],
      exports: [provider],
      envFilePath: [
        `.env.${ENV}`, // ex) .env.dev 또는 .env.production
        '.env',
      ],
    };
  }
}
