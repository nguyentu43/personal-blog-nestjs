import { UserDocument } from 'src/user/user.schema';

export interface JwtToken {
  accessToken: string;
  user: UserDocument;
}

export interface JwtPayload {
  _id: string;
  username: string;
}
