import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Tool } from '@/database/entity/tool.entity';
import { CustomException } from '@/common/exceptions/custom-exception';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { CreateToolDtoTx, ToolResponseDto } from './dto/create-tool.dto';

@Injectable()
export class ToolService {
  private readonly logger = new Logger(ToolService.name);

  constructor(
    @InjectRepository(Tool)
    private readonly toolRepository: Repository<Tool>,
  ) {}

  /**
   * 조리 도구 생성
   */
  async createTool(dto: CreateToolDtoTx): Promise<ToolResponseDto[]> {
    const incomingNames = dto.data.map((element) => element.name);

    // 중복 조리 도구 이름 체크
    const existingTools = await this.toolRepository.find({
      where: {
        name: In(incomingNames),
      },
    });

    if (existingTools.length > 0) {
      throw new CustomException(ERROR_CODES.TOOL_ALREADY_EXISTS);
    }

    const newTools = this.toolRepository.create(dto.data);
    const savedTools = await this.toolRepository.save(newTools);

    return savedTools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      imageUrl: tool.imageUrl,
      createdAt: tool.createdAt,
      updatedAt: tool.updatedAt,
    }));
  }
}
