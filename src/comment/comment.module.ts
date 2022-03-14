import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import * as MongooseAutopopulate from 'mongoose-autopopulate';
import { AuthModule } from 'src/auth/auth.module';
import { CaslModule } from 'src/casl/casl.module';
import { PostModule } from 'src/post/post.module';
import { CommentController } from './comment.controller';
import { Comment, CommentDocument, CommentSchema } from './comment.schema';
import { CommentService } from './comment.service';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Comment.name,
        useFactory: () => {
          const schema = CommentSchema;
          schema.plugin(MongooseAutopopulate);
          schema.pre<CommentDocument>('remove', async function (next) {
            if (this.children.length > 0) {
              for (const id of this.children) {
                await this.db.collections['comments'].remove({ _id: id });
              }
            }
            await this.db.collections['comments'].findOneAndUpdate(
              {
                children: mongoose.Types.ObjectId(this.id),
              },
              { $pull: { children: mongoose.Types.ObjectId(this.id) } },
            );
            await this.db.collections['posts'].findOneAndUpdate(
              {
                comments: mongoose.Types.ObjectId(this.id),
              },
              { $pull: { comments: mongoose.Types.ObjectId(this.id) } },
            );
            next();
          });
          return schema;
        },
      },
    ]),
    AuthModule,
    CaslModule,
    PostModule,
  ],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
