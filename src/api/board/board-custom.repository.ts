import { Injectable } from '@nestjs/common';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BoardEntity } from '@/database/entity/board.entity';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { PaginationOptionsDto } from '@/common/dto/pagination-option.dto';

@Injectable()
export class BoardCustomRepository {
  constructor(
    @InjectRepository(BoardEntity)
    public readonly boardRepository: Repository<BoardEntity>,
  ) {}

  /**
   * 페이징을 포함한 게시글 목록을 조회합니다.
   * @param paginationOptions
   * @param startDate
   * @param endDate
   */
  public async findWithPagination(
    paginationOptions: PaginationOptionsDto,
    startDate: string,
    endDate: string,
  ): Promise<Pagination<BoardEntity>> {
    const { page, limit } = paginationOptions;

    const start = new Date(startDate + 'T00:00:00.000+09:00');
    const end = new Date(endDate + 'T23:59:59.999+09:00');

    return await paginate<BoardEntity>(
      this.boardRepository,
      { page, limit },
      {
        where: {
          createdAt: Between(start, end),
        },
        order: {
          createdAt: 'DESC',
        },
        relations: ['createdBy', 'updatedBy'],
      },
    );
  }
}
