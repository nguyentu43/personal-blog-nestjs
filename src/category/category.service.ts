import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UploadService } from 'src/upload/upload.service';
import { Category, CategoryDocument } from './category.schema';
import { CreateCategoryDto } from './dto/CreateCategoryDto';
import { UpdateCategoryDto } from './dto/UpdateCategoryDto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    private uploadService: UploadService,
  ) {}

  async find(): Promise<CategoryDocument[]> {
    return await this.categoryModel.find();
  }

  async findById(id: string): Promise<CategoryDocument> {
    const category = await this.categoryModel.findById(id);
    if (!category) throw new NotFoundException();
    return category;
  }

  async findBySlug(slug: string): Promise<CategoryDocument> {
    const category = await this.categoryModel.findOne({ slug });
    if (!category) throw new NotFoundException();
    return category;
  }

  async create(
    background: Express.Multer.File,
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryDocument> {
    const data = createCategoryDto;
    if (background) {
      const { public_id, secure_url } = await this.uploadService.upload(
        background,
      );
      data['background'] = { publicId: public_id, url: secure_url };
    }
    return await this.categoryModel.create(data);
  }

  async update(
    id: string,
    background: Express.Multer.File,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryDocument> {
    const category = await this.categoryModel.findById(id);
    if (!category) throw new NotFoundException();
    const data = updateCategoryDto;
    if (background) {
      const { public_id, secure_url } = await this.uploadService.upload(
        background,
      );
      data['background'] = { publicId: public_id, url: secure_url };
      category.background &&
        (await this.uploadService.delete(category.background.publicId));
    }
    return await this.categoryModel.findByIdAndUpdate(id, data, {
      new: true,
    });
  }

  async remove(id: string): Promise<any> {
    const category = await this.categoryModel.findByIdAndRemove(id);
    category?.background &&
      (await this.uploadService.delete(category?.background.publicId));
    if (category) return { ok: 1 };
    throw new NotFoundException();
  }
}
