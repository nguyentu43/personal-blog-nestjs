import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Action } from 'src/casl/action.enum';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory';
import { Category } from './category.schema';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/CreateCategoryDto';
import { UpdateCategoryDto } from './dto/UpdateCategoryDto';
import { CategoryParams } from './param/CategoryParams';

@Controller('categories')
export class CategoryController {
  constructor(
    private categoryService: CategoryService,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  async find() {
    return await this.categoryService.find();
  }

  @Get(':id')
  async findById(@Param() params: CategoryParams) {
    const { id } = params;
    return await this.categoryService.findById(id);
  }

  @Get('/slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return await this.categoryService.findBySlug(slug);
  }

  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('background'))
  @Post()
  async create(
    @Request() req,
    @UploadedFile() background: Express.Multer.File,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    const ability = this.caslAbilityFactory.createForUser(req.user);
    if (ability.can(Action.Create, Category)) {
      return await this.categoryService.create(background, createCategoryDto);
    }
    throw new ForbiddenException();
  }

  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('background'))
  @Patch(':id')
  async update(
    @Request() req,
    @Param() params: CategoryParams,
    @UploadedFile() background: Express.Multer.File,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const ability = this.caslAbilityFactory.createForUser(req.user);
    if (ability.cannot(Action.Update, Category)) throw new ForbiddenException();
    const { id } = params;
    return await this.categoryService.update(id, background, updateCategoryDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Request() req, @Param() params: CategoryParams) {
    const ability = this.caslAbilityFactory.createForUser(req.user);
    if (ability.cannot(Action.Update, Category)) throw new ForbiddenException();
    const { id } = params;
    return await this.categoryService.remove(id);
  }
}
