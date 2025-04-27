import { LoginDto } from '@/api/login/dto/login.dto';
import { PickType } from '@nestjs/swagger';

export class SigninDtoTx extends PickType(LoginDto, [
  'passid',
  'password',
] as const) {}
