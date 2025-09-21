import { DataSource } from 'typeorm';
import { Tool } from '../entity/tool.entity';

export class ToolSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    if (!this.dataSource || !this.dataSource.manager) {
      throw new Error('DataSource or manager is not available');
    }

    const toolRepository = this.dataSource.manager.getRepository(Tool);

    const existingCount = await toolRepository.count();
    if (existingCount > 0) {
      console.log('Tool data already exists, skipping seed');
      return;
    }

    const tools = [
      { name: '가위', imageUrl: '' },
      { name: '칼/도마', imageUrl: '' },
      { name: '전자레인지', imageUrl: '' },
      { name: '프라이팬(원팬)', imageUrl: '' },
      { name: '프라이팬(멀티팬)', imageUrl: '' },
      { name: '냄비(원팟)', imageUrl: '' },
      { name: '냄비(멀티팟)', imageUrl: '' },
      { name: '밥솥', imageUrl: '' },
      { name: '에어프라이어', imageUrl: '' },
    ];

    await toolRepository.save(tools);

    console.log('ToolSeed executed successfully');
  }
}
