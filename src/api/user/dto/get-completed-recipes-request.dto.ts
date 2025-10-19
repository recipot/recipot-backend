import { PaginationDto } from '@/common/dto/pagination.dto';
import { PickType } from '@nestjs/swagger';

export class GetCompletedRecipesRequestDto extends PickType(PaginationDto, [
  'page',
  'limit',
]) {}
