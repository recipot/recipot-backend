import { PickType } from '@nestjs/swagger';
import { BoardDto } from '@/api/board/dto/board.dto';

export class GetBoardsDtoRx extends PickType(BoardDto, [
  'id',
  'title',
  'content',
  'createdBy',
  'createdAt',
  'updatedBy',
  'updatedAt',
] as const) {}
