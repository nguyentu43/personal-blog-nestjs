import { IsMongoId } from 'class-validator';

export class PostParams {
  @IsMongoId()
  id: string;
}
