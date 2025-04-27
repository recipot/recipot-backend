import { PickType } from '@nestjs/swagger';
import { BoardDto } from '@/api/board/dto/board.dto';

export class CreateBoardDtoTx extends PickType(BoardDto, [
  'title',
  'content',
] as const) {}
