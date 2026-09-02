import {
  EventPublisher,
  Events,
  OrderCancelledEvent,
  OrderCreatedEvent,
} from '@core-platform/common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order } from './schemas/order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    private readonly events: EventPublisher,
  ) {}

  findAll() {
    return this.orderModel.find().exec();
  }

  findByUser(userId: string) {
    return this.orderModel.find({ userId }).exec();
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  async create(input: CreateOrderDto) {
    const total = input.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const order = await this.orderModel.create({
      ...input,
      total,
      status: 'pending',
    });
    await this.events.publish<OrderCreatedEvent>(Events.ORDER_CREATED, {
      id: String(order._id),
      userId: order.userId,
      items: order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
    return order;
  }

  async updateStatus(id: string, input: UpdateOrderStatusDto) {
    const order = await this.orderModel
      .findByIdAndUpdate(id, { status: input.status }, { new: true })
      .exec();
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    if (input.status === 'cancelled') {
      await this.events.publish<OrderCancelledEvent>(Events.ORDER_CANCELLED, {
        id: String(order._id),
        userId: order.userId,
        items: order.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
    }
    return order;
  }
}
