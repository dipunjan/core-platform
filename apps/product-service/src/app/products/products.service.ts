import {
  CatalogCache,
  EventPublisher,
  Events,
  mongoWrite,
  ProductCreatedEvent,
} from '@core-platform/common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CategoriesService } from './categories.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    private readonly events: EventPublisher,
    private readonly categories: CategoriesService,
    private readonly catalogCache: CatalogCache,
  ) {}

  async findAll(filters: { category?: string; featured?: boolean } = {}) {
    const cacheName = `products:${filters.category ?? 'all'}:${filters.featured ? '1' : '0'}`;
    const cached = await this.catalogCache.getJson<unknown[]>(cacheName);
    if (cached) {
      return cached;
    }
    const query: Record<string, unknown> = {};
    if (filters.category) {
      await this.categories.findBySlug(filters.category);
      query.category = filters.category;
    }
    if (filters.featured) {
      query.featured = true;
    }
    const rows = await this.productModel.find(query).lean().exec();
    await this.catalogCache.setJson(cacheName, rows);
    return rows;
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    const cacheName = `product:${id}`;
    const cached = await this.catalogCache.getJson<unknown>(cacheName);
    if (cached) {
      return cached;
    }
    const product = await this.productModel.findById(id).lean().exec();
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    await this.catalogCache.setJson(cacheName, product);
    return product;
  }

  async create(input: CreateProductDto) {
    await this.categories.requireCategorySlug(input.category);
    const product = await mongoWrite(
      this.productModel.create({
        ...input,
        featured: input.featured ?? false,
      }),
      'SKU already exists',
    );
    await this.events.publish<ProductCreatedEvent>(Events.PRODUCT_CREATED, {
      id: String(product._id),
      name: product.name,
      sku: product.sku,
    });
    await this.catalogCache.bump();
    return product;
  }

  async update(id: string, input: UpdateProductDto) {
    await this.findOne(id);
    if (input.category) {
      await this.categories.requireCategorySlug(input.category);
    }
    const product = await mongoWrite(
      this.productModel.findByIdAndUpdate(id, input, { new: true }).exec(),
      'SKU already exists',
    );
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    await this.catalogCache.bump();
    return product;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.productModel.findByIdAndDelete(id).exec();
    await this.catalogCache.bump();
  }
}
