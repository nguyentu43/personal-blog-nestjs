import { targetModulesByContainer } from '@nestjs/core/router/router-module';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsMongoId,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { PostSort } from '../enum/postSort.enum';

export class QueryPostDto {
  @IsOptional()
  keyword: string;

  @IsOptional()
  @IsMongoId()
  user: string;

  @IsOptional()
  @IsMongoId()
  category: string;

  @IsOptional()
  skip: number;

  @IsOptional()
  limit: number;

  @IsOptional()
  @IsArray()
  @ValidateIf((q) => q.tags?.length <= 5, {
    message: 'Tags length must be below 6',
  })
  tags: string;

  @IsOptional()
  @IsDate()
  @ValidateIf((q) => q.toDate && q.fromDate > q.toDate)
  fromDate: Date;

  @IsOptional()
  @IsDate()
  @ValidateIf((q) => q.fromDate && q.fromDate < q.toDate)
  toDate: Date;

  @IsOptional()
  @IsEnum(PostSort)
  sort: PostSort;
}
