import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongoSchema, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class Comment {
  @Prop()
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
    type: MongoSchema.Types.ObjectId,
    ref: 'Post',
    required: true,
  })
  post: Types.ObjectId;

  @Prop({
    type: [{ type: MongoSchema.Types.ObjectId, ref: 'Comment' }],
    autopopulate: true,
  })
  children: Types.ObjectId[];

  @Prop()
  gif: string;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
