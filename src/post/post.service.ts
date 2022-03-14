import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isMongoId } from 'class-validator';
import { Model, Types } from 'mongoose';
import { CategoryService } from 'src/category/category.service';
import { UploadService } from 'src/upload/upload.service';
import { CreatePostDto } from './dto/CreatePostDto';
import { QueryPostDto } from './dto/QueryPostDto';
import { UpdatePostDto } from './dto/UpdatePostDto';
import { PostSort } from './enum/postSort.enum';
import { Post, PostDocument } from './post.schema';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private uploadService: UploadService,
    private categoryService: CategoryService,
  ) {}

  async create(
    cover: Express.Multer.File,
    createPostDto: CreatePostDto,
  ): Promise<PostDocument> {
    const data = createPostDto;
    if (cover) {
      const { public_id, secure_url } = await this.uploadService.upload(cover);
      data['cover'] = { publicId: public_id, url: secure_url };
    }

    if (!(await this.categoryService.findById(data.category))) {
      throw new NotFoundException('Category not found');
    }

    return await this.postModel.create(data);
  }

  async findById(id: string): Promise<PostDocument> {
    const post = await this.postModel.findById(id);
    if (!post) throw new NotFoundException();
    return post;
  }

  async findBySlug(slug: string): Promise<PostDocument> {
    const post = await this.postModel.findOne({ slug });
    if (!post) throw new NotFoundException();
    return post;
  }

  async findByQuery(
    query: Partial<QueryPostDto>,
    isBlocked = false,
  ): Promise<PostDocument[]> {
    const {
      keyword,
      user,
      category,
      limit,
      skip,
      tags,
      fromDate,
      toDate,
      sort,
    } = query;
    let queryBuilder = this.postModel.find({});

    if (keyword) {
      queryBuilder = queryBuilder.where({ $text: { $search: keyword } });
    }
    if (user) {
      queryBuilder = queryBuilder.where({
        owner: new Types.ObjectId(user),
      });
    }
    if (category) {
      queryBuilder = queryBuilder.where({
        category: new Types.ObjectId(category),
      });
    }

    if (fromDate && toDate) {
      queryBuilder = queryBuilder.where({
        $and: [
          { createdAt: { $gte: fromDate } },
          { createdAt: { $lte: toDate } },
        ],
      });
    }
    if (tags) {
      queryBuilder = queryBuilder.where({ tags: { $in: tags } });
    }
    queryBuilder = queryBuilder.where({ isBlocked });
    if (sort) {
      switch (sort) {
        case PostSort.NEWEST:
          queryBuilder = queryBuilder.sort('+createdAt');
          break;
        case PostSort.POPULAR:
          queryBuilder = queryBuilder.sort('+viewCount');
          break;
        default:
          throw new Error('PostSort Type not found');
      }
    }
    if (skip || limit)
      queryBuilder = queryBuilder.skip(Number(skip)).limit(Number(limit));

    return await queryBuilder.exec();
  }

  async findSuggestedPost(user, query) {
    const following = user.following.map(({ _id }) => new Types.ObjectId(_id));
    const aggregate: any[] = [
      {
        $addFields: { priority: { $in: ['$owner', following] } },
      },
      { $sort: { priority: -1, createdAt: -1 } },
    ];

    if (query.limit) aggregate.push({ $limit: Number(query.limit) });

    if (query.skip) aggregate.push({ $skip: Number(query.skip) });

    const posts = await this.postModel.aggregate(aggregate);
    return posts;
  }

  async update(
    id: string,
    cover: Express.Multer.File,
    updatePostDto: UpdatePostDto,
  ): Promise<PostDocument> {
    const post = await this.postModel.findById(id);
    if (!post) throw new NotFoundException();
    const data = updatePostDto;
    if (
      data.category &&
      !(await this.categoryService.findById(data.category))
    ) {
      throw new NotFoundException('Category not found');
    }
    if (cover) {
      const { public_id, secure_url } = await this.uploadService.upload(cover);
      data['cover'] = { publicId: public_id, url: secure_url };
      post.cover && (await this.uploadService.delete(post.cover.publicId));
    }
    if (data.removeCover && post.cover) {
      await this.uploadService.delete(post.cover.publicId);
      data['cover'] = null;
    }

    return await this.postModel.findByIdAndUpdate(
      id,
      {
        ...data,
        category: new Types.ObjectId(data.category),
      },
      {
        new: true,
      },
    );
  }

  async remove(id: string): Promise<any> {
    const post = await this.postModel.findByIdAndRemove(id);
    if (post) {
      post.cover && (await this.uploadService.delete(post.cover.publicId));
      return { ok: 1 };
    }
    throw new NotFoundException();
  }

  async like(id: string, userId: string, likes: boolean): Promise<any> {
    let res = null;
    if (likes) {
      res = await this.postModel.updateOne(
        { _id: id },
        { $addToSet: { likes: userId } },
      );
    } else {
      res = await this.postModel.updateOne(
        { _id: id },
        { $pull: { likes: userId } },
      );
    }

    if (res.nModified === 1) {
      return { ok: 1 };
    }
    throw new NotFoundException();
  }

  async incViewCount(slugOrId: string) {
    let post = null;
    if (isMongoId(slugOrId)) {
      post = await this.postModel.findByIdAndUpdate(
        slugOrId,
        { $inc: { viewCount: 1 } },
        { new: true },
      );
    } else {
      post = await this.postModel.findOneAndUpdate(
        { slug: slugOrId },
        { $inc: { viewCount: 1 } },
        { new: true },
      );
    }
    if (!post) throw new NotFoundException();
    return post;
  }

  async block(id: string, isBlocked: boolean) {
    const post = await this.postModel.findByIdAndUpdate(
      id,
      { isBlocked },
      { new: true },
    );
    if (!post) throw new NotFoundException();
    return { ok: 1 };
  }
}
