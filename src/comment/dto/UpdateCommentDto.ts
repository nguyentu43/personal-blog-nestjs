import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateCommentDto } from './CreateCommentDto';

export class UpdateCommentDto extends PartialType(
  PickType(CreateCommentDto, ['content', 'gif'] as const),
) {}
