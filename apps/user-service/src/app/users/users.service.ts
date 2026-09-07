import {
  EventPublisher,
  Events,
  mongoWrite,
  UserCreatedEvent,
} from '@core-platform/common';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { createHash, timingSafeEqual } from 'crypto';
import { isValidObjectId, Model } from 'mongoose';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateManagedUserDto } from './dto/update-managed-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
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
        role: this.staffRoleForEmail(input.email),
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
    const role = this.staffRoleForEmail(user.email);
    if (role === 'admin' && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }
    return this.issueSession(user);
  }

  findAll() {
    return this.userModel.find().sort({ role: 1, email: 1 }).exec();
  }

  async createManaged(input: CreateManagedUserDto) {
    const password = await bcrypt.hash(input.password, 12);
    const user = await mongoWrite(
      this.userModel.create({
        email: input.email.toLowerCase(),
        name: input.name,
        password,
        phone: input.phone,
        address: input.address,
        role: input.role,
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

  async updateManaged(id: string, input: UpdateManagedUserDto) {
    const user = await this.requireUser(id);
    if (input.name) {
      user.name = input.name;
    }
    if (input.phone !== undefined) {
      user.phone = input.phone;
    }
    if (input.address) {
      user.set('address', input.address);
    }
    await user.save();
    return user;
  }

  async updateRole(id: string, input: UpdateUserRoleDto, actorId: string) {
    if (id === actorId && input.role !== 'admin') {
      throw new BadRequestException('You cannot demote yourself');
    }
    const user = await this.requireUser(id);
    if (input.role === 'customer' && user.role === 'admin') {
      await this.assertNotLastAdmin();
    }
    user.role = input.role;
    await user.save();
    return user;
  }

  async removeManaged(id: string, actorId: string) {
    if (id === actorId) {
      throw new BadRequestException('You cannot delete your own account here');
    }
    const user = await this.requireUser(id);
    if (user.role === 'admin') {
      await this.assertNotLastAdmin();
    }
    await this.userModel.findByIdAndDelete(id).exec();
  }

  private async requireUser(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('User not found');
    }
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async assertNotLastAdmin() {
    const admins = await this.userModel.countDocuments({ role: 'admin' }).exec();
    if (admins <= 1) {
      throw new BadRequestException('Cannot remove the last admin');
    }
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
      if (user) {
        await this.userModel
          .findByIdAndUpdate(user._id, { $unset: { refreshTokenHash: 1 } })
          .exec();
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
    return this.issueSession(user);
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

  private staffRoleForEmail(email: string): 'customer' | 'admin' {
    const adminEmail = this.config.get<string>('ADMIN_EMAIL')?.trim().toLowerCase();
    if (adminEmail && email.toLowerCase() === adminEmail) {
      return 'admin';
    }
    return 'customer';
  }

  private async issueSession(user: {
    _id: unknown;
    email: string;
    name: string;
    role?: string;
    phone?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      region: string;
      postalCode: string;
      country: string;
    };
  }) {
    const sub = String(user._id);
    const refreshExpiresIn =
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const role = user.role === 'admin' ? 'admin' : 'customer';
    const refreshToken = await this.jwt.signAsync(
      { sub, email: user.email, typ: 'refresh', role },
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
    user: {
      _id: unknown;
      email: string;
      name: string;
      phone?: string;
      role?: string;
      address?: {
        line1: string;
        line2?: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
      };
    },
    refreshToken: string,
  ) {
    const sub = String(user._id);
    const accessExpiresIn =
      this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';
    const role = user.role === 'admin' ? 'admin' : 'customer';
    const accessToken = await this.jwt.signAsync({
      sub,
      email: user.email,
      typ: 'access',
      role,
    });
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer' as const,
      expiresIn: accessExpiresIn,
      user: {
        id: sub,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role,
        address: user.address,
      },
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
