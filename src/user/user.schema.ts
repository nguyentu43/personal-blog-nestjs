import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongoSchema } from 'mongoose';
import { Link } from 'src/common/link.schema';
import { Post } from 'src/post/post.schema';
import { Role } from './role.enum';

export type UserDocument = User & Document;

@Schema()
export class User extends Document {
  @Prop({ unique: true, required: true })
  username: string;

  @Prop({ enum: Role, default: Role.USER })
  role: Role;

  @Prop({ required: true, trim: true, unique: true })
  email: string;

  @Prop({ required: true, trim: true, select: false })
  password: string;

  @Prop({ type: Link })
  avatar: Link;

  @Prop({ required: true, trim: true })
  nickname: string;

  @Prop({ type: [{ type: MongoSchema.Types.ObjectId, ref: 'User' }] })
  follower: Types.ObjectId[];

  @Prop({ type: [{ type: MongoSchema.Types.ObjectId, ref: 'User' }] })
  following: Types.ObjectId[];

  @Prop({ type: [{ type: MongoSchema.Types.ObjectId, ref: 'Post' }] })
  savedPosts: Types.ObjectId[];

  @Prop({ type: raw({ token: String, expiredDate: Date }), select: false })
  resetPassword: Record<string, any>;
}

export const UserSchema = SchemaFactory.createForClass(User);
