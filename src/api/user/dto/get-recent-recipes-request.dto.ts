import { PaginationDto } from '@/common/dto/pagination.dto';
import { PickType } from '@nestjs/swagger';

export class GetRecentRecipesRequestDto extends PickType(PaginationDto, [
  'page',
  'limit',
]) {}
