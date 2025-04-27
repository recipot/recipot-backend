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

rl.question(
  '생성할 마이그레이션 이름을 입력해 주세요. (예: CreateTableUsers): ',
  (name) => {
    if (!name?.trim()) {
      logger.error('❌ 이름을 입력해 주세요.', 'MigrationGenerator');
      rl.close();
      return;
    }

    const desc = name.trim().replace(/\s+/g, '');
    const timestamp = new Date(Date.now() + 9 * 60 * 60 * 1000)
      .toISOString()
      .replace(/[-T:.Z]/g, '')
      .slice(0, 14);

    const className = `Migration${timestamp}`;
    const fileName = `${timestamp.slice(0, 8)}-${desc}.ts`;
    const filePath = path.join(__dirname, 'migrations', fileName);

    const template = `
import { Table } from 'typeorm';

module.exports = class ${className} {
  async up(queryRunner) {
    // TODO: Write migration logic here
  }

  async down(queryRunner) {
    // TODO: Write rollback logic here
  }
};
`;

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, template.trimStart());

    logger.log({
      level: 'info',
      message: `✅ Migration created: ${filePath}`,
      context: 'MigrationGenerator',
    });

    rl.close();
  },
);
