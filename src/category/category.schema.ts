import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Link } from 'src/common/link.schema';

export type CategoryDocument = Category & Document;

@Schema()
export class Category {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  background: Link;

  @Prop({ slug: 'name' })
  slug: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
