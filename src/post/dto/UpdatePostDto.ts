import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreatePostDto } from './CreatePostDto';

export class UpdatePostDto extends PartialType(
  OmitType(CreatePostDto, ['owner'] as const),
) {
  @IsOptional()
  @IsBoolean()
  removeCover: boolean;
}
