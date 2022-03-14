import { IsOptional } from 'class-validator';

export class QuerySavedPostDto {
  @IsOptional()
  limit: number;

  @IsOptional()
  skip: number;
}
