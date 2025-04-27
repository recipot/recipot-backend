import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { CustomLoggerService } from '@/common/logger/custom-logger.service';
import { LoggerFactoryService } from '@/common/logger/logger-factory.service';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger: CustomLoggerService;

  constructor(
    private readonly loggerFactory: LoggerFactoryService,
    private readonly dataSource: DataSource,
  ) {
    this.logger = this.loggerFactory.create(DatabaseService.name);
  }

  public async initializeConnection(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
      this.logger.log('Database connection initialized');
    }
  }

  public async transaction<T>(
    task: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await task(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  public query(tableName: string, alias?: string) {
    return this.dataSource
      .getRepository(tableName)
      .createQueryBuilder(alias || tableName);
  }

  public async raw<T>(query: string, parameters?: any[]): Promise<T> {
    return await this.dataSource.query(query, parameters);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      this.logger.log('Database connection closed');
    }
  }
}
