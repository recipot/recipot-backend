import { Module } from '@nestjs/common';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { BoardCustomRepository } from './board-custom.repository';
import { DatabaseModule } from '@/database/database.module';
import { UserCustomRepository } from '@/api/user/user-custom.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [BoardController],
  providers: [BoardService, BoardCustomRepository, UserCustomRepository],
})
export class BoardModule {}
