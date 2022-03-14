import {
  Body,
  Controller,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateUserDto } from 'src/user/dto/CreateUserDto';
import { AuthService } from './auth.service';
import { RequestResetPasswordDto } from './dto/RequestResetPasswordDto';
import { ResetPasswordDto } from './dto/ResetPasswordDto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req) {
    return await this.authService.login(req.user);
  }

  @UseInterceptors(FileInterceptor('avatar'))
  @Post('register')
  async register(
    @UploadedFile() avatar: Express.Multer.File,
    @Body() createUserDto: CreateUserDto,
  ) {
    return await this.authService.register(avatar, createUserDto);
  }

  @Post('reset-password')
  async requestResetPassword(@Body() body: RequestResetPasswordDto) {
    return await this.authService.sendEmailReset(body);
  }

  @Post('process-reset')
  async processResetPassword(@Body() body: ResetPasswordDto) {
    return await this.authService.processResetPassword(body);
  }
}
