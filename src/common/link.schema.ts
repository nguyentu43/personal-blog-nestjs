import { Prop } from '@nestjs/mongoose';

export class Link {
  @Prop()
  publicId: string;

  @Prop()
  url: string;
}
