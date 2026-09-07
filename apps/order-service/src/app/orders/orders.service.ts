import {
  EventPublisher,
  Events,
  mongoWrite,
  OrderCancelledEvent,
  OrderCreatedEvent,
} from '@core-platform/common';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order, type OrderStatus } from './schemas/order.schema';

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: [],
  cancelled: [],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    private readonly events: EventPublisher,
  ) {}

  findByUser(userId: string) {
    return this.orderModel.find({ userId }).exec();
  }

  findAll() {
    return this.orderModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string, userId: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    const order = await this.orderModel.findOne({ _id: id, userId }).exec();
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  async create(userId: string, input: CreateOrderDto) {
    const total = input.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const order = await mongoWrite(
      this.orderModel.create({
        userId,
        items: input.items,
        shippingAddress: input.shippingAddress,
        total,
        status: 'pending',
      }),
      'Could not create order',
    );
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

  async updateStatus(id: string, userId: string, input: UpdateOrderStatusDto) {
    const order = await this.findOne(id, userId);
    if (order.status === input.status) {
      return order;
    }
    if (!TRANSITIONS[order.status].includes(input.status)) {
      throw new BadRequestException(
        `Cannot change order from ${order.status} to ${input.status}`,
      );
    }
    order.status = input.status;
    await mongoWrite(order.save(), 'Could not update order');
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
