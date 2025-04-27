import { Inject, Injectable } from '@nestjs/common';
import { CreateBoardDtoTx } from './dto/create-board.dto';
import { UpdateBoardDtoTx } from './dto/update-board.dto';
import { BoardCustomRepository } from '@/api/board/board-custom.repository';
import { UserCustomRepository } from '@/api/user/user-custom.repository';
import { CustomException } from '@/common/exceptions/custom-exception';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { GetBoardsDtoRx } from '@/api/board/dto/get-boards.dto';
import { AccessTokenPayload } from '@/api/jwt/jwt.type';
import { PaginationOptionsDto } from '@/common/dto/pagination-option.dto';
import { toBoardDto } from '@/api/board/mapper/board.mapper';

@Injectable()
export class BoardService {
  constructor(
    @Inject(BoardCustomRepository)
    private readonly boardCustomRepository: BoardCustomRepository,
    @Inject(UserCustomRepository)
    private readonly userCustomRepository: UserCustomRepository,
  ) {}

  /**
   * 게시글을 생성합니다.
   * @param user
   * @param dto
   */
  public async createBoard(
    user: AccessTokenPayload,
    dto: CreateBoardDtoTx,
  ): Promise<GetBoardsDtoRx> {
    const existUser = await this.userCustomRepository.userRepository.findOne({
      where: { id: user.userId },
    });
    if (!existUser) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    const newBoard = this.boardCustomRepository.boardRepository.create({
      ...dto,
      createdBy: existUser,
      updatedBy: existUser,
    });

    const savedBoard =
      await this.boardCustomRepository.boardRepository.save(newBoard);

    return toBoardDto(savedBoard);
  }

  /**
   * 게시글을 업데이트합니다.
   * @param user
   * @param id
   * @param dto
   */
  public async updateBoard(
    user: AccessTokenPayload,
    id: number,
    dto: UpdateBoardDtoTx,
  ): Promise<void> {
    const existUser = await this.userCustomRepository.userRepository.findOne({
      where: { id: user.userId },
    });
    if (!existUser) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    const board = await this.boardCustomRepository.boardRepository.findOne({
      where: { id },
    });

    if (!board) {
      throw new CustomException(ERROR_CODES.DATA_NOT_FOUND);
    }

    board.title = dto.title;
    board.content = dto.content;
    board.updatedBy = existUser;
    await this.boardCustomRepository.boardRepository.save(board);
  }

  /**
   * 페이지네이션과 함께 게시글 목록을 조회합니다.
   * @param paginationOptionDto
   * @param startDate
   * @param endDate
   */
  public async getBoards(
    paginationOptionDto: PaginationOptionsDto,
    startDate: string,
    endDate: string,
  ): Promise<GetBoardsDtoRx[]> {
    const paginationResult =
      await this.boardCustomRepository.findWithPagination(
        paginationOptionDto,
        startDate,
        endDate,
      );

    return paginationResult.items.map((board) => toBoardDto(board));
  }

  /**
   * 게시글을 상세 조회 합니다.
   * @param id
   */
  public async getBoardById(id: number) {
    return await this.boardCustomRepository.boardRepository.findOneBy({ id });
  }

  /**
   * 게시글을 삭제합니다.
   * @param id
   */
  public async deleteBoard(id: number) {
    const board = await this.getBoardById(id);
    if (!board) {
      throw new CustomException(ERROR_CODES.DATA_NOT_FOUND);
    }

    await this.boardCustomRepository.boardRepository.delete(id);
  }
}
