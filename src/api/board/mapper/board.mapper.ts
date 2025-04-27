import { GetBoardsDtoRx } from '@/api/board/dto/get-boards.dto';
import { BoardEntity } from '@/database/entity/board.entity';
import { toUserDto } from '@/api/user/mapper/user.mapper';

// Board Entity -> GetBoardsDtoRx
export function toBoardDto(board: BoardEntity): GetBoardsDtoRx {
  return {
    id: board.id,
    title: board.title,
    content: board.content,
    createdBy: toUserDto(board.createdBy),
    createdAt: board.createdAt,
    updatedBy: toUserDto(board.updatedBy),
    updatedAt: board.updatedAt,
  };
}
