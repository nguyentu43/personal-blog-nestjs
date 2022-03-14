import { IsEnum, IsMongoId, IsString } from 'class-validator';
import { ParentType } from '../enum/parentType.enum';

export class CreateCommentDto {
  @IsString()
  content: string;

  owner: string;

  gif: string;

  @IsString()
  parentId: string;

  @IsEnum(ParentType)
  parentType: string;

  @IsMongoId()
  post: string;
}
