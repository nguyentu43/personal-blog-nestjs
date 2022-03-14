import {
  Controller,
  Get,
  Request,
  UseGuards,
  Patch,
  Body,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
  Delete,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { FollowUserDto } from './dto/FollowUserDto';
import { QuerySavedPostDto } from './dto/QuerySavedPostDto';
import { SavedPostDto } from './dto/SavedPostDto';
import { UpdateUserDto } from './dto/UpdateUserDto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Request() req) {
    return req.user;
  }

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':username')
  async findByUsername(@Param('username') username: string) {
    const users = await this.userService.find({ username });
    if (users.length === 0) throw new NotFoundException();
    return users[0];
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('follow')
  async follow(@Request() req, @Body() followUserDto: FollowUserDto) {
    return await this.userService.follow({
      ...followUserDto,
      sourceUserId: req.user._id,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('unfollow')
  async unfollow(@Request() req, @Body() followUserDto: FollowUserDto) {
    return await this.userService.unfollow({
      ...followUserDto,
      sourceUserId: req.user._id,
    });
  }

  @UseInterceptors(FileInterceptor('avatar'))
  @UseGuards(AuthGuard('jwt'))
  @Patch('me/update-profile')
  async updateMe(
    @UploadedFile() avatar: Express.Multer.File,
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.update(
      req.user.username,
      avatar,
      updateUserDto,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/saved-posts')
  async getSavedPosts(@Query() query: QuerySavedPostDto, @Request() req) {
    return await this.userService.getSavedPosts(req.user.id, query);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('me/saved-posts')
  async addSavedPost(@Body() savedPostDto: SavedPostDto, @Request() req) {
    const { postId } = savedPostDto;
    return await this.userService.addSavedPost(postId, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('me/saved-posts')
  async removeSavedPost(@Query() savedPostDto: SavedPostDto, @Request() req) {
    const { postId } = savedPostDto;
    return await this.userService.removeSavedPost(postId, req.user.id);
  }
}
