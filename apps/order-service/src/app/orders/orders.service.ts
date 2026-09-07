import {
  Events,
  isDuplicateKey,
  OrderCancelledEvent,
  OrderCreatedEvent,
} from '@core-platform/common';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, isValidObjectId, Model } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OutboxEvent } from '../outbox/schemas/outbox-event.schema';
import { ProductCatalogService } from './product-catalog.service';
import { Order, type OrderDocument, type OrderStatus } from './schemas/order.schema';

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
    @InjectModel(OutboxEvent.name) private readonly outboxModel: Model<OutboxEvent>,
    @InjectConnection() private readonly connection: Connection,
    private readonly catalog: ProductCatalogService,
  ) {}

  findByUser(userId: string) {
    return this.orderModel.find({ userId }).sort({ createdAt: -1 }).exec();
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

  async create(userId: string, input: CreateOrderDto, idempotencyKey?: string) {
    const key = idempotencyKey?.trim();
    if (key) {
      const existing = await this.orderModel
        .findOne({ userId, idempotencyKey: key })
        .exec();
      if (existing) {
        return existing;
      }
    }

    const items = await Promise.all(
      input.items.map(async (item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: await this.catalog.priceFor(item.productId),
      })),
    );
    const total = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    const session = await this.connection.startSession();
    try {
      let order!: OrderDocument;
      await session.withTransaction(async () => {
        const [created] = await this.orderModel.create(
          [
            {
              userId,
              items,
              shippingAddress: input.shippingAddress,
              total,
              status: 'pending',
              ...(key ? { idempotencyKey: key } : {}),
            },
          ],
          { session },
        );
        order = created;
        const payload: OrderCreatedEvent = {
          id: String(order._id),
          userId: order.userId,
          items: order.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        };
        await this.outboxModel.create(
          [
            {
              routingKey: Events.ORDER_CREATED,
              payload: payload as unknown as Record<string, unknown>,
              aggregateId: String(order._id),
              publishedAt: null,
              attempts: 0,
            },
          ],
          { session },
        );
      });
      return order;
    } catch (err) {
      if (key && isDuplicateKey(err)) {
        const existing = await this.orderModel
          .findOne({ userId, idempotencyKey: key })
          .exec();
        if (existing) {
          return existing;
        }
      }
      throw err;
    } finally {
      await session.endSession();
    }
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

    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        order.status = input.status;
        await order.save({ session });
        if (input.status === 'cancelled') {
          const payload: OrderCancelledEvent = {
            id: String(order._id),
            userId: order.userId,
            items: order.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          };
          await this.outboxModel.create(
            [
              {
                routingKey: Events.ORDER_CANCELLED,
                payload: payload as unknown as Record<string, unknown>,
                aggregateId: String(order._id),
                publishedAt: null,
                attempts: 0,
              },
            ],
            { session },
          );
        }
      });
      return order;
    } finally {
      await session.endSession();
    }
  }
}
