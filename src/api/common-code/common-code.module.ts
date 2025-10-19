import { Global, Module } from '@nestjs/common';
import { CommonCodeService } from './common-code.service';
import { CommonCodeController } from './common-code.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonCode } from '@/database/entity/common-code.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([CommonCode])],
  controllers: [CommonCodeController],
  providers: [CommonCodeService],
  exports: [CommonCodeService],
})
export class CommonCodeModule {}
