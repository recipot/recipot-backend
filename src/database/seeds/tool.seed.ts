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
      { name: '가위', image_url: '' },
      { name: '칼/도마', image_url: '' },
      { name: '전자레인지', image_url: '' },
      { name: '프라이팬(원팬)', image_url: '' },
      { name: '프라이팬(멀티팬)', image_url: '' },
      { name: '냄비(원팟)', image_url: '' },
      { name: '냄비(멀티팟)', image_url: '' },
      { name: '밥솥', image_url: '' },
      { name: '에어프라이어', image_url: '' },
    ];

    await toolRepository.save(tools);

    console.log('ToolSeed executed successfully');
  }
}
