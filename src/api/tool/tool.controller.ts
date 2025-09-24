import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ToolService } from './tool.service';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/enums/role.enum';
import { CreateToolDtoTx, ToolResponseDto } from './dto/create-tool.dto';

@ApiTags('조리 도구')
@Controller({ path: 'tools', version: '1' })
export class ToolController {
  constructor(private readonly toolService: ToolService) {}

  @Post('admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: '[어드민] 조리 도구 생성',
    description: '새로운 조리 도구를 데이터베이스에 생성합니다.',
  })
  @ApiBody({
    description: '생성할 조리 도구의 데이터',
    type: CreateToolDtoTx,
  })
  @ApiSuccessResponse('조리 도구 생성 성공', {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: '후라이팬' },
        image_url: {
          type: 'string',
          example: 'https://example.com/images/frying-pan.jpg',
        },
        created_at: {
          type: 'string',
          format: 'date-time',
          example: '2025-09-06T12:15:00.000Z',
        },
        updated_at: {
          type: 'string',
          format: 'date-time',
          example: '2025-09-06T12:15:00.000Z',
        },
      },
    },
  })
  async createTool(@Body() dto: CreateToolDtoTx): Promise<ToolResponseDto[]> {
    return this.toolService.createTool(dto);
  }
}
