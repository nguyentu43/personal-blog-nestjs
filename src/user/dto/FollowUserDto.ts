import { IsMongoId, IsOptional } from 'class-validator';

export class FollowUserDto {
  @IsOptional()
  @IsMongoId()
  sourceUserId: string;

  @IsMongoId()
  targetUserId: string;
}
