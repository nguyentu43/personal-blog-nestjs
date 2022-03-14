import { IsEmail, IsString } from 'class-validator';

export class RequestResetPasswordDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  targetLink: string;
}
