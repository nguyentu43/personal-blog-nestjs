import { IsMongoId } from 'class-validator';

export class CommentParams {
  @IsMongoId()
  id: string;
}
