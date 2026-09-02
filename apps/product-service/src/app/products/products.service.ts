import {
  EventPublisher,
  Events,
  mongoWrite,
  ProductCreatedEvent,
} from '@core-platform/common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    private readonly events: EventPublisher,
  ) {}

  findAll() {
    return this.productModel.find().exec();
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async create(input: CreateProductDto) {
    const product = await mongoWrite(
      this.productModel.create(input),
      'SKU already exists',
    );
    await this.events.publish<ProductCreatedEvent>(Events.PRODUCT_CREATED, {
      id: String(product._id),
      name: product.name,
      sku: product.sku,
    });
    return product;
  }

  async update(id: string, input: UpdateProductDto) {
    await this.findOne(id);
    const product = await mongoWrite(
      this.productModel.findByIdAndUpdate(id, input, { new: true }).exec(),
      'SKU already exists',
    );
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.productModel.findByIdAndDelete(id).exec();
  }
}
