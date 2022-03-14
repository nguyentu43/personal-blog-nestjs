import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { UploadService } from 'src/upload/upload.service';
import { CreateUserDto } from './dto/CreateUserDto';
import { FollowUserDto } from './dto/FollowUserDto';
import { QuerySavedPostDto } from './dto/QuerySavedPostDto';
import { QueryUserDto } from './dto/QueryUserDto';
import { UpdateUserDto } from './dto/UpdateUserDto';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private uploadService: UploadService,
  ) {}

  async create(
    avatar: Express.Multer.File,
    createUserDto: CreateUserDto,
  ): Promise<UserDocument> {
    const hashedPassword = await this.hashPassword(createUserDto.password);
    try {
      const data = {
        ...createUserDto,
        password: hashedPassword,
      };
      if (avatar) {
        const { public_id, secure_url } = await this.uploadService.upload(
          avatar,
        );
        data['avatar'] = { publicId: public_id, url: secure_url };
      }

      return await this.userModel.create(data);
    } catch (e) {
      if (e.code === 11000)
        throw new ForbiddenException('Username/email has already existed');
      else throw new InternalServerErrorException();
    }
  }

  private async hashPassword(password: string) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  }

  async validate(
    username: string,
    password: string,
  ): Promise<UserDocument | null> {
    try {
      const user = await this.userModel
        .findOne({ username })
        .select('+password')
        .exec();
      if (user && (await bcrypt.compare(password, user.password))) {
        delete user.password;
        return user;
      }
      return null;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async find(filter: Partial<QueryUserDto>): Promise<UserDocument[]> {
    try {
      return await this.userModel
        .find(filter)
        .populate('follower')
        .populate('following');
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async findAll() {
    return await this.userModel.find({});
  }

  async update(
    username: string,
    avatar: Express.Multer.File,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findOne({ username });
    if (!user) throw new NotFoundException();

    const data = updateUserDto;
    if (avatar) {
      const { public_id, secure_url } = await this.uploadService.upload(avatar);
      data['avatar'] = { publicId: public_id, url: secure_url };
      user.avatar && (await this.uploadService.delete(user.avatar.publicId));
    }
    if (updateUserDto.password) {
      updateUserDto.password = await this.hashPassword(updateUserDto.password);
    }
    return await this.userModel.findOneAndUpdate({ username }, updateUserDto, {
      new: true,
    });
  }

  async follow(followUserDto: FollowUserDto) {
    try {
      const { sourceUserId, targetUserId } = followUserDto;
      const source = await this.userModel.findByIdAndUpdate(sourceUserId, {
        $addToSet: { following: targetUserId },
      });
      const target = await this.userModel.findByIdAndUpdate(targetUserId, {
        $addToSet: { follower: sourceUserId },
      });
      if (!source && !target) throw new NotFoundException('User not found');
      return { ok: 1 };
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async unfollow(followUserDto: FollowUserDto) {
    try {
      const { sourceUserId, targetUserId } = followUserDto;
      const source = await this.userModel.findByIdAndUpdate(sourceUserId, {
        $pull: { following: targetUserId },
      });
      const target = await this.userModel.findByIdAndUpdate(targetUserId, {
        $pull: { follower: sourceUserId },
      });
      if (!source && !target) throw new NotFoundException('User not found');
      return { ok: 1 };
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async addSavedPost(postId: string, userId: string) {
    const user = await this.userModel.findByIdAndUpdate(userId, {
      $addToSet: { savedPosts: postId },
    });
    if (!user) throw new NotFoundException('User not found');
    return { ok: 1 };
  }

  async removeSavedPost(postId: string, userId: string) {
    const user = await this.userModel.findByIdAndUpdate(userId, {
      $pull: { savedPosts: postId },
    });
    if (!user) throw new NotFoundException('User not found');
    return { ok: 1 };
  }

  async getSavedPosts(userId: string, query: QuerySavedPostDto) {
    const { limit, skip } = query;
    let user = null;

    if (!limit && !skip) {
      user = await this.userModel.findById(userId).populate('savedPosts');
    } else {
      user = await this.userModel
        .findById(userId)
        .populate({ path: 'savedPosts', limit, skip });
    }
    return user.savedPosts;
  }
}
