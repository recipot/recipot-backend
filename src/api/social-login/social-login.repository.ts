import { SocialLoginEntity } from '@/database/entity/social-login.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SocialLoginCustomRepository {
  constructor(
    @InjectRepository(SocialLoginEntity)
    public readonly SocialLoginRepository: Repository<SocialLoginEntity>,
  ) {}
}
