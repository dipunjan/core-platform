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
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { createHash, timingSafeEqual } from 'crypto';
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
    private readonly config: ConfigService,
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
    return this.issueSession(user);
  }

  async login(input: LoginDto) {
    const user = await this.userModel
      .findOne({ email: input.email.toLowerCase() })
      .select('+password')
      .exec();
    if (!user || !(await bcrypt.compare(input.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.issueSession(user);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string; typ?: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.userModel
      .findById(payload.sub)
      .select('+refreshTokenHash')
      .exec();
    if (
      !user?.refreshTokenHash ||
      !refreshTokenMatches(refreshToken, user.refreshTokenHash)
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return this.sessionBody(user, refreshToken);
  }

  async logout(userId: string) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } })
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
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

  private async issueSession(user: {
    _id: unknown;
    email: string;
    name: string;
  }) {
    const sub = String(user._id);
    const refreshExpiresIn =
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const refreshToken = await this.jwt.signAsync(
      { sub, email: user.email, typ: 'refresh' },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn as `${number}d`,
      },
    );
    await this.userModel
      .findByIdAndUpdate(user._id, {
        $set: { refreshTokenHash: hashRefreshToken(refreshToken) },
      })
      .exec();
    return this.sessionBody(user, refreshToken);
  }

  private async sessionBody(
    user: { _id: unknown; email: string; name: string },
    refreshToken: string,
  ) {
    const sub = String(user._id);
    const accessExpiresIn =
      this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';
    const accessToken = await this.jwt.signAsync({
      sub,
      email: user.email,
      typ: 'access',
    });
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer' as const,
      expiresIn: accessExpiresIn,
      user: { id: sub, email: user.email, name: user.name },
    };
  }
}

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function refreshTokenMatches(token: string, storedHash: string): boolean {
  const digest = Buffer.from(hashRefreshToken(token));
  const stored = Buffer.from(storedHash);
  return digest.length === stored.length && timingSafeEqual(digest, stored);
}
