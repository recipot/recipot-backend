import { PaginationDto } from '@/common/dto/pagination.dto';
import { PickType } from '@nestjs/swagger';

export class GetBookmarksRequestDto extends PickType(PaginationDto, [
  'page',
  'limit',
]) {}
