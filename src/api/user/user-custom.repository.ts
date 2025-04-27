import { Injectable } from '@nestjs/common';
import { FindManyOptions, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@/database/entity/user.entity';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';

@Injectable()
export class UserCustomRepository {
  constructor(
    @InjectRepository(UserEntity)
    public readonly userRepository: Repository<UserEntity>,
  ) {}

  public async findWithPagination(
    options: IPaginationOptions,
    searchOptions: FindManyOptions<UserEntity>,
  ): Promise<Pagination<UserEntity>> {
    return await paginate<UserEntity>(
      this.userRepository,
      options,
      searchOptions,
    );
  }
}
