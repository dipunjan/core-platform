import { EventPublisher, Events, UserCreatedEvent } from '@core-platform/common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { isValidObjectId, Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly events: EventPublisher,
  ) {}

  findAll() {
    return this.userModel.find().exec();
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`User ${id} not found`);
    }
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async create(input: CreateUserDto) {
    const password = await bcrypt.hash(input.password, 10);
    const user = await this.userModel.create({ ...input, password });
    await this.events.publish<UserCreatedEvent>(Events.USER_CREATED, {
      id: String(user._id),
      email: user.email,
      name: user.name,
    });
    return user;
  }

  async update(id: string, input: UpdateUserDto) {
    const update = { ...input };
    if (input.password) {
      update.password = await bcrypt.hash(input.password, 10);
    }
    const user = await this.userModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    await this.events.publish(Events.USER_UPDATED, {
      id: String(user._id),
      email: user.email,
      name: user.name,
    });
    return user;
  }

  async remove(id: string) {
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
  }
}
