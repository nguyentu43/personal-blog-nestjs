import { Comment } from 'src/comment/comment.schema';
import { Post } from 'src/post/post.schema';
import { User } from 'src/user/user.schema';
import {
  InferSubjects,
  Ability,
  AbilityBuilder,
  AbilityClass,
  ExtractSubjectType,
} from '@casl/ability';
import { Action } from './action.enum';
import { Injectable } from '@nestjs/common';
import { Role } from 'src/user/role.enum';
import { Category } from 'src/category/category.schema';

type Subjects =
  | InferSubjects<typeof Post | typeof User | typeof Comment | typeof Category>
  | 'all';

export type AppAbility = Ability<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, build } = new AbilityBuilder<Ability<[Action, Subjects]>>(
      Ability as AbilityClass<AppAbility>,
    );

    if (user.role === Role.ADMIN) {
      can(Action.Manage, 'all');
    } else {
      can(Action.Read, 'all');
    }

    can(Action.Manage, Post, { owner: user._id });
    can(Action.Manage, Comment, { owner: user._id });

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
