import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v2, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import toStream = require('buffer-to-stream');

@Injectable()
export class UploadService {
  async upload(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      if (
        !(
          file.mimetype.startsWith('image') || file.mimetype.startsWith('video')
        )
      ) {
        throw new ForbiddenException('File not supported');
      }
      const upload = v2.uploader.upload_stream(
        { folder: 'social' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      toStream(file.buffer).pipe(upload);
    });
  }

  async delete(id: string) {
    const res = await v2.uploader.destroy(id);
    if (res.result === 'ok') return { ok: 1 };
    throw new NotFoundException();
  }
}
