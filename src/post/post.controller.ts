import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  Query,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { query } from 'express';
import { Action } from 'src/casl/action.enum';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory';
import { Role } from 'src/user/role.enum';
import { CreatePostDto } from './dto/CreatePostDto';
import { QueryPostDto } from './dto/QueryPostDto';
import { UpdatePostDto } from './dto/UpdatePostDto';
import { PostAction } from './enum/postAction.enum';
import { PostSort } from './enum/postSort.enum';
import { PostParams } from './param/PostParams';
import { PostService } from './post.service';

@Controller('posts')
export class PostController {
  constructor(
    private postService: PostService,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  async find(@Query() query: QueryPostDto) {
    return await this.postService.findByQuery(query);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async findOfMe(@Request() req) {
    return await this.postService.findByQuery({ user: req.user.id });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('suggest')
  async findSuggestedPost(@Request() req, @Query() query) {
    return await this.postService.findSuggestedPost(req.user, query);
  }

  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('cover'))
  @Post()
  async create(
    @UploadedFile() cover: Express.Multer.File,
    @Body() createPostDto: CreatePostDto,
    @Request() req,
  ) {
    createPostDto.owner = req.user._id;
    return await this.postService.create(cover, createPostDto);
  }

  @Get(':id')
  async findById(
    @Param() params: PostParams,
    @Request() req,
    @Res({ passthrough: true }) res,
  ) {
    const { id } = params;
    if (req.cookies['post-' + id]) {
      return await this.postService.findById(id);
    }
    res.cookie('post-' + id, true);
    return await this.postService.incViewCount(id);
  }

  @Get('/slug/:slug')
  async findBySlug(
    @Param('slug') slug: string,
    @Request() req,
    @Res({ passthrough: true }) res,
  ) {
    const post = await this.postService.findBySlug(slug);
    if (req.cookies['post-' + post._id]) {
      return post;
    }
    res.cookie('post-' + post._id, true);
    return await this.postService.incViewCount(slug);
  }

  @Get('/stats/trending')
  async trending() {
    const posts = await this.postService.findByQuery({
      sort: PostSort.POPULAR,
      limit: 10,
    });
    let tags = new Set();
    for (const post of posts) {
      tags = new Set([...tags, ...post.tags]);
    }

    return { tags: Array.from(tags) };
  }

  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('cover'))
  @Patch(':id')
  async update(
    @Param() params: PostParams,
    @UploadedFile() cover: Express.Multer.File,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req,
  ) {
    const { id } = params;
    const post = await this.postService.findById(id);
    const ability = this.caslAbilityFactory.createForUser(req.user);
    if (ability.can(Action.Update, post)) {
      return await this.postService.update(id, cover, updatePostDto);
    }
    throw new ForbiddenException();
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param() params: PostParams, @Request() req) {
    const { id } = params;
    const post = await this.postService.findById(id);
    const ability = this.caslAbilityFactory.createForUser(req.user);
    if (ability.can(Action.Update, post)) {
      return await this.postService.remove(id);
    }
    throw new ForbiddenException();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id')
  async actionPost(
    @Param() params: PostParams,
    @Body('action') action: PostAction,
    @Request() req,
  ) {
    const { id } = params;
    if (
      [PostAction.BLOCK_POST, PostAction.UNBLOCK_POST].includes(action) &&
      req.user.role !== Role.ADMIN
    ) {
      throw new ForbiddenException();
    }

    switch (action) {
      case PostAction.LIKE_POST:
        return await this.postService.like(id, req.user._id, true);
      case PostAction.UNLIKE_POST:
        return await this.postService.like(id, req.user._id, false);
      case PostAction.BLOCK_POST:
        return await this.postService.block(id, true);
      case PostAction.UNBLOCK_POST:
        return await this.postService.block(id, false);
      default:
        throw new NotFoundException();
    }
  }
}
