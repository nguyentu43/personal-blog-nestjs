import { IsEnum, IsString } from 'class-validator';
import { ParentType } from '../enum/parentType.enum';

export class FindCommentDto {
  @IsEnum(ParentType)
  parentType: string;

  @IsString()
  parentId: string;
}
