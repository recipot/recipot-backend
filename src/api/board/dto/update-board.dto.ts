import { PartialType } from '@nestjs/swagger';
import { CreateBoardDtoTx } from '@/api/board/dto/create-board.dto';

export class UpdateBoardDtoTx extends PartialType(CreateBoardDtoTx) {}
