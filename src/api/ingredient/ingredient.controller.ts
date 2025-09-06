import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IngredientService } from './ingredient.service';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { IngredientCategory } from '@/database/entity/ingredient-category.entity';
import { CreateIngredientCategoryDtoTx } from './dto/create-ingredient-category.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/enums/role.enum';

@ApiTags('재료')
@Controller({ path: 'ingredients', version: '1' })
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('Authorization')
  @Post('categories')
  @ApiOperation({
    summary: '재료 카테고리 생성',
    description: '새로운 재료 카테고리를 데이터베이스에 생성합니다.',
  })
  @ApiBody({
    description: '생성할 재료 카테고리의 데이터',
    type: CreateIngredientCategoryDtoTx,
  })
  @ApiSuccessResponse('재료 카테고리 생성 성공', {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: '해산물류' },
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
  async createIngredientCategory(
    @Body() dto: CreateIngredientCategoryDtoTx,
  ): Promise<IngredientCategory[]> {
    return this.ingredientService.createIngredientCategory(dto);
  }
}
