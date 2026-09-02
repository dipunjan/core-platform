import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Cart } from './schemas/cart.schema';

@Injectable()
export class CartsService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
  ) {}

  async getCart(userId: string) {
    const cart = await this.cartModel.findOne({ userId }).exec();
    return cart ?? this.cartModel.create({ userId, items: [] });
  }

  async addItem(userId: string, input: AddCartItemDto) {
    const cart = await this.getCart(userId);
    const existing = cart.items.find((item) => item.productId === input.productId);
    if (existing) {
      existing.quantity += input.quantity;
    } else {
      cart.items.push({ productId: input.productId, quantity: input.quantity });
    }
    return cart.save();
  }

  async updateItem(userId: string, productId: string, input: UpdateCartItemDto) {
    const cart = await this.getCart(userId);
    const item = cart.items.find((entry) => entry.productId === productId);
    if (!item) {
      throw new NotFoundException(`Product ${productId} is not in the cart`);
    }
    item.quantity = input.quantity;
    return cart.save();
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.getCart(userId);
    cart.items = cart.items.filter((item) => item.productId !== productId);
    return cart.save();
  }

  async clear(userId: string) {
    const cart = await this.getCart(userId);
    cart.items = [];
    return cart.save();
  }
}
