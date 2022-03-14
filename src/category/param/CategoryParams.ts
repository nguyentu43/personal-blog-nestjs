import { IsMongoId } from 'class-validator';

export class CategoryParams {
  @IsMongoId()
  id: string;
}
