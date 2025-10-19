import { winstonConfig } from '@/common/logger/winston.config';
import { WinstonModule } from 'nest-winston';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const logger = WinstonModule.createLogger(winstonConfig);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('생성할 시드 이름을 입력해 주세요. (예: RecipeSeed): ', (name) => {
  if (!name?.trim()) {
    logger.error('❌ 이름을 입력해 주세요.', 'SeedGenerator');
    rl.close();
    return;
  }

  const seedName = name.trim().replace(/\s+/g, '').replace(/Seed$/, '');
  const className = `${seedName}Seed`;
  const fileName = `${seedName
    .toLowerCase()
    .replace(/([A-Z])/g, '-$1')
    .replace(/^-/, '')}.seed.ts`;
  const filePath = path.join(__dirname, 'seeds', fileName);

  const template = `import { DataSource } from 'typeorm';
// import { YourEntity } from '../entity/your-entity.entity';

export class ${className} {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    if (!this.dataSource || !this.dataSource.manager) {
      throw new Error('DataSource or manager is not available');
    }

    // const repository = this.dataSource.manager.getRepository(YourEntity);
    
    // TODO: 시드 데이터 작성
    console.log('${className} executed');
  }
}
`;

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, template);

  logger.log({
    level: 'info',
    message: `✅ Seed created: ${filePath}`,
    context: 'SeedGenerator',
  });

  rl.close();
});
