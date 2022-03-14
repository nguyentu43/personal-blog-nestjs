import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Action } from 'src/casl/action.enum';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/CreateCommentDto';
import { FindCommentDto } from './dto/FindCommentDto';
import { UpdateCommentDto } from './dto/UpdateCommentDto';
import { CommentAction } from './enum/commentAction.enum';
import { CommentParams } from './param/CommentParams';

@Controller('comments')
export class CommentController {
  constructor(
    private commentService: CommentService,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  async find(@Query() findCommentDto: FindCommentDto) {
    return await this.commentService.find(findCommentDto);
  }

  @Get('size')
  async findCommentSize(@Query('postId') postId: string) {
    return { size: await this.commentService.commentSize(postId) };
  }

  @Get(':id')
  async findById(@Param() params: CommentParams) {
    const { id } = params;
    return await this.commentService.findById(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() createCommentDto: CreateCommentDto, @Request() req) {
    createCommentDto.owner = req.user._id;
    return await this.commentService.create(createCommentDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Request() req,
    @Param() params: CommentParams,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    const { id } = params;
    const comment = await this.commentService.findById(id);
    const ability = this.caslAbilityFactory.createForUser(req.user);
    if (ability.can(Action.Update, comment)) {
      return await this.commentService.update(id, updateCommentDto);
    }
    throw new ForbiddenException();
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Request() req, @Param() params: CommentParams) {
    const { id } = params;
    const comment = await this.commentService.findById(id);
    const ability = this.caslAbilityFactory.createForUser(req.user);
    if (ability.can(Action.Delete, comment)) {
      return await this.commentService.remove(id);
    }
    throw new ForbiddenException();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id')
  async actionComment(
    @Param() params: CommentParams,
    @Body('action') action: CommentAction,
    @Request() req,
  ) {
    const { id } = params;
    switch (action) {
      case CommentAction.LIKE_COMMENT:
        return await this.commentService.like(id, req.user._id, true);
      case CommentAction.UNLIKE_COMMENT:
        return await this.commentService.like(id, req.user._id, false);
      default:
        throw new ForbiddenException();
    }
  }
}
