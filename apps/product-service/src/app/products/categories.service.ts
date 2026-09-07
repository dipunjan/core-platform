import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { mongoWrite } from '@core-platform/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
  ) {}

  findAll() {
    return this.categoryModel.find().sort({ sortOrder: 1, name: 1 }).exec();
  }

  async findBySlug(slug: string) {
    const category = await this.categoryModel.findOne({ slug }).exec();
    if (!category) {
      throw new NotFoundException(`Category ${slug} not found`);
    }
    return category;
  }

  async requireCategorySlug(slug: string) {
    const category = await this.categoryModel.findOne({ slug }).exec();
    if (!category) {
      throw new BadRequestException(`Unknown category "${slug}"`);
    }
    return category;
  }

  async create(input: CreateCategoryDto) {
    return mongoWrite(this.categoryModel.create(input), 'Slug already exists');
  }

  async update(id: string, input: UpdateCategoryDto) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    const category = await mongoWrite(
      this.categoryModel.findByIdAndUpdate(id, input, { new: true }).exec(),
      'Slug already exists',
    );
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    const category = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
  }
}
