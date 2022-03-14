import { IsArray, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsMongoId()
  owner: string;

  @IsMongoId()
  category: string;

  @IsString()
  title: string;

  @IsString()
  excerpt: string;

  @IsOptional()
  @IsArray()
  tags: string[];
}
