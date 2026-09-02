import { mongoWrite } from '@core-platform/common';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { SetQuantityDto } from './dto/set-quantity.dto';
import { Inventory } from './schemas/inventory.schema';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<Inventory>,
  ) {}

  findAll() {
    return this.inventoryModel.find().exec();
  }

  async findOne(productId: string) {
    const item = await this.inventoryModel.findOne({ productId }).exec();
    if (!item) {
      throw new NotFoundException(`No inventory for product ${productId}`);
    }
    return item;
  }

  async setQuantity(productId: string, input: SetQuantityDto) {
    return mongoWrite(
      this.inventoryModel
        .findOneAndUpdate(
          { productId },
          { $set: { quantity: input.quantity } },
          { new: true, upsert: true, setDefaultsOnInsert: true },
        )
        .exec(),
      'Inventory already exists for this product',
    );
  }

  async reserve(productId: string, input: AdjustStockDto) {
    const item = await mongoWrite(
      this.inventoryModel
        .findOneAndUpdate(
          {
            productId,
            $expr: {
              $gte: [{ $subtract: ['$quantity', '$reserved'] }, input.amount],
            },
          },
          { $inc: { reserved: input.amount } },
          { new: true },
        )
        .exec(),
      'Inventory already exists for this product',
    );
    if (!item) {
      await this.findOne(productId);
      throw new BadRequestException('Insufficient available stock');
    }
    return item;
  }

  async release(productId: string, input: AdjustStockDto) {
    const item = await mongoWrite(
      this.inventoryModel
        .findOneAndUpdate(
          { productId, reserved: { $gte: input.amount } },
          { $inc: { reserved: -input.amount } },
          { new: true },
        )
        .exec(),
      'Inventory already exists for this product',
    );
    if (item) {
      return item;
    }
    const existing = await this.findOne(productId);
    existing.reserved = 0;
    return mongoWrite(
      existing.save(),
      'Inventory already exists for this product',
    );
  }

  async reserveForOrder(orderId: string, productId: string, amount: number) {
    const already = await this.inventoryModel
      .findOne({ productId, reservationKeys: orderId })
      .exec();
    if (already) {
      return already;
    }
    const item = await mongoWrite(
      this.inventoryModel
        .findOneAndUpdate(
          {
            productId,
            reservationKeys: { $ne: orderId },
            $expr: {
              $gte: [{ $subtract: ['$quantity', '$reserved'] }, amount],
            },
          },
          {
            $inc: { reserved: amount },
            $addToSet: { reservationKeys: orderId },
          },
          { new: true },
        )
        .exec(),
      'Inventory already exists for this product',
    );
    if (!item) {
      await this.findOne(productId);
      throw new BadRequestException(
        `Insufficient stock to reserve ${amount} of ${productId} for order ${orderId}`,
      );
    }
    return item;
  }

  async releaseForOrder(orderId: string, productId: string, amount: number) {
    const item = await mongoWrite(
      this.inventoryModel
        .findOneAndUpdate(
          { productId, reservationKeys: orderId, reserved: { $gte: amount } },
          {
            $inc: { reserved: -amount },
            $pull: { reservationKeys: orderId },
          },
          { new: true },
        )
        .exec(),
      'Inventory already exists for this product',
    );
    if (item) {
      return item;
    }
    return this.inventoryModel.findOne({ productId }).exec();
  }
}
