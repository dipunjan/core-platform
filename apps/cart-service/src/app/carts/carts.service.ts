import {
  isDuplicateKey,
  isVersionError,
  mongoWrite,
  throwDuplicate,
} from '@core-platform/common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Cart } from './schemas/cart.schema';

const CART_DUPLICATE = 'Cart already exists for this user';

@Injectable()
export class CartsService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
  ) {}

  async getCart(userId: string) {
    const cart = await this.cartModel.findOne({ userId }).exec();
    if (cart) {
      return cart;
    }
    try {
      return await this.cartModel.create({ userId, items: [] });
    } catch (error) {
      if (isDuplicateKey(error)) {
        const existing = await this.cartModel.findOne({ userId }).exec();
        if (existing) {
          return existing;
        }
      }
      throwDuplicate(error, CART_DUPLICATE);
    }
  }

  async addItem(userId: string, input: AddCartItemDto) {
    return this.withRetry(async () => {
      const cart = await this.getCart(userId);
      const existing = cart.items.find(
        (item) => item.productId === input.productId,
      );
      if (existing) {
        existing.quantity += input.quantity;
      } else {
        cart.items.push({
          productId: input.productId,
          quantity: input.quantity,
        });
      }
      return mongoWrite(cart.save(), CART_DUPLICATE);
    });
  }

  async updateItem(userId: string, productId: string, input: UpdateCartItemDto) {
    return this.withRetry(async () => {
      const cart = await this.getCart(userId);
      const item = cart.items.find((entry) => entry.productId === productId);
      if (!item) {
        throw new NotFoundException(`Product ${productId} is not in the cart`);
      }
      item.quantity = input.quantity;
      return mongoWrite(cart.save(), CART_DUPLICATE);
    });
  }

  async removeItem(userId: string, productId: string) {
    return this.withRetry(async () => {
      const cart = await this.getCart(userId);
      cart.items = cart.items.filter((item) => item.productId !== productId);
      return mongoWrite(cart.save(), CART_DUPLICATE);
    });
  }

  async clear(userId: string) {
    return this.withRetry(async () => {
      const cart = await this.getCart(userId);
      cart.items = [];
      return mongoWrite(cart.save(), CART_DUPLICATE);
    });
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (isVersionError(error)) {
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }
}
