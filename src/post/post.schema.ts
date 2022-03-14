import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongoSchema, Types } from 'mongoose';
import { Link } from 'src/common/link.schema';

export type PostDocument = Post & Document;

@Schema({
  timestamps: { createdAt: true, updatedAt: true },
})
export class Post {
  @Prop({ index: 'text', required: true })
  title: string;

  @Prop({ index: 'text', required: true })
  excerpt: string;

  @Prop({ required: true, index: 'text' })
  content: string;

  @Prop({
    type: [
      { type: MongoSchema.Types.ObjectId, ref: 'User', autopopulate: true },
    ],
  })
  likes: Types.ObjectId[];

  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    autopopulate: true,
  })
  owner: Types.ObjectId;

  @Prop({
    type: [
      {
        type: MongoSchema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    autopopulate: true,
  })
  comments: Types.ObjectId[];

  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: 'Category',
    autopopulate: true,
  })
  category: Types.ObjectId;

  @Prop()
  cover: Link;

  @Prop({ default: false })
  isBlocked: boolean;

  @Prop({ type: [String] })
  tags: string[];

  @Prop({ slug: 'title' })
  slug: string;

  @Prop({ default: 0 })
  viewCount: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);
