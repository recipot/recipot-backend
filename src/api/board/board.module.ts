import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { BoardCustomRepository } from './board-custom.repository';
import { BoardEntity } from '@/database/entity/board.entity';
import { UserEntity } from '@/database/entity/user.entity';
import { DatabaseModule } from '@/database/database.module';
import { UserCustomRepository } from '@/api/user/user-custom.repository';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([BoardEntity, UserEntity]),
  ],
  controllers: [BoardController],
  providers: [BoardService, BoardCustomRepository, UserCustomRepository],
})
export class BoardModule {}
