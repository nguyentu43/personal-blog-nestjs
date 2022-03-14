import { IsMongoId } from 'class-validator';

export class SavedPostDto {
  @IsMongoId()
  postId: string;
}
