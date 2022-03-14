import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from './CreateUserDto';

export class UpdateUserDto extends PartialType(
  PickType(CreateUserDto, ['nickname', 'password', 'information'] as const),
) {}
