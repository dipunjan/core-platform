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
    return this.inventoryModel
      .findOneAndUpdate(
        { productId },
        { $set: { quantity: input.quantity } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  async reserve(productId: string, input: AdjustStockDto) {
    const item = await this.findOne(productId);
    const available = item.quantity - item.reserved;
    if (input.amount > available) {
      throw new BadRequestException(`Only ${available} units available`);
    }
    item.reserved += input.amount;
    return item.save();
  }

  async release(productId: string, input: AdjustStockDto) {
    const item = await this.findOne(productId);
    item.reserved = Math.max(0, item.reserved - input.amount);
    return item.save();
  }
}
