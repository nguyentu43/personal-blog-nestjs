import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as MongooseAutopopulate from 'mongoose-autopopulate';
import * as MongooseSlug from 'mongoose-slug-generator';
import { AuthModule } from 'src/auth/auth.module';
import { CaslModule } from 'src/casl/casl.module';
import { CategoryModule } from 'src/category/category.module';
import { UploadModule } from 'src/upload/upload.module';
import { PostController } from './post.controller';
import { Post, PostSchema } from './post.schema';
import { PostService } from './post.service';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Post.name,
        useFactory: () => {
          const schema = PostSchema;
          schema.plugin(MongooseAutopopulate);
          schema.plugin(MongooseSlug);
          return schema;
        },
      },
    ]),
    AuthModule,
    UploadModule,
    CaslModule,
    CategoryModule,
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
