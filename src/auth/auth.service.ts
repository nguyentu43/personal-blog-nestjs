import { Injectable, NotFoundException } from '@nestjs/common';
import { UserDocument } from 'src/user/user.schema';
import { UserService } from 'src/user/user.service';
import { AuthCredentialsDto } from './dto/AuthCredentialsDto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, JwtToken } from './jwt.interface';
import { CreateUserDto } from 'src/user/dto/CreateUserDto';
import { Role } from 'src/user/role.enum';
import { RequestResetPasswordDto } from './dto/RequestResetPasswordDto';
import { nanoid } from 'nanoid';
import { ResetPasswordDto } from './dto/ResetPasswordDto';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async validate(
    authCredentialDto: AuthCredentialsDto,
  ): Promise<UserDocument | null> {
    const { username, password } = authCredentialDto;
    return await this.userService.validate(username, password);
  }

  async register(
    avatar: Express.Multer.File,
    createUserDto: CreateUserDto,
  ): Promise<JwtToken> {
    const user = await this.userService.create(avatar, {
      ...createUserDto,
      role: Role.USER,
    });
    return await this.login(user);
  }

  async login(user: UserDocument): Promise<JwtToken> {
    const { _id, username } = user;
    delete user.password;
    const payload: JwtPayload = { _id, username };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      user,
    };
  }

  async findUsername(username: string): Promise<UserDocument> {
    const list = await this.userService.find({ username });
    return list.length === 1 && list[0];
  }

  async sendEmailReset(body: RequestResetPasswordDto) {
    const { username, email, targetLink } = body;
    const user = await this.findUsername(username);
    if (user && user.email === email) {
      const token = nanoid();
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() + 1);

      user.set('resetPassword', {
        token,
        expiredDate,
      });
      await user.save();

      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Reset Password',
        template: 'reset-password',
        context: {
          pagename: this.configService.get<string>('PAEGNAME'),
          username,
          link: targetLink + '?token=' + token,
        },
      });
    }
    return { ok: 1 };
  }

  async processResetPassword(body: ResetPasswordDto) {
    const { password, token, username } = body;

    const user = await this.findUsername(username);
    if (
      user &&
      user.resetPassword.token === token &&
      user.resetPassword.expiredDate < new Date()
    ) {
      await this.userService.update(username, null, { password });
      return { ok: 1 };
    }
    throw new NotFoundException('Reset Password Error. Please try again');
  }
}
