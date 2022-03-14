import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PostService } from 'src/post/post.service';
import { CommentDocument, Comment } from './comment.schema';
import { CreateCommentDto } from './dto/CreateCommentDto';
import { FindCommentDto } from './dto/FindCommentDto';
import { UpdateCommentDto } from './dto/UpdateCommentDto';
import { ParentType } from './enum/parentType.enum';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private postService: PostService,
  ) {}

  async create(createCommentDto: CreateCommentDto): Promise<CommentDocument> {
    const { parentType, parentId, ...data } = createCommentDto;
    let comment;
    if (parentType === ParentType.COMMENT) {
      const parent = await this.commentModel.findById(parentId);
      if (!parent) throw new NotFoundException();
      comment = await this.commentModel.create(data);
      parent.children.push(comment);
      await parent.save();
    } else if (parentType === ParentType.POST) {
      const parent = await this.postService.findById(parentId);
      if (!parent) throw new NotFoundException();
      comment = await this.commentModel.create(data);
      parent.comments.push(comment);
      await parent.save();
    }
    return comment;
  }

  async findById(id: string) {
    return await this.commentModel.findById(id);
  }

  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentDocument> {
    const comment = await this.commentModel.findByIdAndUpdate(
      id,
      updateCommentDto,
      { new: true },
    );
    if (!comment) throw new NotFoundException();
    return comment;
  }

  async remove(id: string): Promise<any> {
    let comment = await this.commentModel.findById(id);
    if (!comment) throw new NotFoundException();
    comment = await comment.populate('children').execPopulate();
    await comment.remove();
    return { ok: 1 };
  }

  async commentSize(postId: string) {
    return await this.commentModel.find({ post: postId }).count();
  }

  async find(findCommentDto: FindCommentDto): Promise<any[]> {
    const { parentType, parentId } = findCommentDto;

    if (parentType === ParentType.COMMENT) {
      const comment = await (
        await this.commentModel.findById(parentId)
      )
        .populate({
          path: 'children',
          populate: { path: 'owner' },
        })
        .execPopulate();
      return comment.children;
    } else if (parentType === ParentType.POST) {
      const post = await (
        await this.postService.findById(parentId)
      )
        .populate({
          path: 'comments',
          populate: { path: 'owner' },
        })
        .execPopulate();
      return post.comments;
    }
  }

  async like(id: string, userId: string, likes: boolean): Promise<any> {
    let res;
    if (likes) {
      res = await this.commentModel.updateOne(
        { _id: id },
        { $addToSet: { likes: userId } },
      );
    } else {
      res = await this.commentModel.updateOne(
        { _id: id },
        { $pull: { likes: userId } },
      );
    }

    if (res.nModified === 1) {
      return { ok: 1 };
    }
    throw new NotFoundException();
  }
}
