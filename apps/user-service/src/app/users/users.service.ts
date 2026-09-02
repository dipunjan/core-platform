import {
  EventPublisher,
  Events,
  mongoWrite,
  UserCreatedEvent,
} from '@core-platform/common';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly events: EventPublisher,
    private readonly jwt: JwtService,
  ) {}

  async findMe(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(input: CreateUserDto) {
    const password = await bcrypt.hash(input.password, 12);
    const user = await mongoWrite(
      this.userModel.create({
        ...input,
        email: input.email.toLowerCase(),
        password,
      }),
      'Email already in use',
    );
    await this.events.publish<UserCreatedEvent>(Events.USER_CREATED, {
      id: String(user._id),
      email: user.email,
      name: user.name,
    });
    return user;
  }

  async login(input: LoginDto) {
    const user = await this.userModel
      .findOne({ email: input.email.toLowerCase() })
      .select('+password')
      .exec();
    if (!user || !(await bcrypt.compare(input.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const accessToken = await this.jwt.signAsync({
      sub: String(user._id),
      email: user.email,
    });
    return {
      accessToken,
      tokenType: 'Bearer' as const,
      user: { id: String(user._id), email: user.email, name: user.name },
    };
  }

  async update(userId: string, input: UpdateUserDto) {
    const update = { ...input };
    if (input.email) {
      update.email = input.email.toLowerCase();
    }
    if (input.password) {
      update.password = await bcrypt.hash(input.password, 12);
    }
    const user = await mongoWrite(
      this.userModel.findByIdAndUpdate(userId, update, { new: true }).exec(),
      'Email already in use',
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.events.publish(Events.USER_UPDATED, {
      id: String(user._id),
      email: user.email,
      name: user.name,
    });
    return user;
  }

  async remove(userId: string) {
    const user = await this.userModel.findByIdAndDelete(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}
