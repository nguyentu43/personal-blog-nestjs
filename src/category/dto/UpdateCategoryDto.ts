import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './CreateCategoryDto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
