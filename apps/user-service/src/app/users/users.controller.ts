import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import {
  AuthCookieService,
  CurrentUser,
  Public,
  type AuthUser,
  type CookieResponse,
} from '@core-platform/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cookies: AuthCookieService,
  ) {}

  @Public()
  @Post()
  async create(
    @Body() body: CreateUserDto,
    @Res({ passthrough: true }) res: CookieResponse,
  ) {
    const session = await this.usersService.create(body);
    this.cookies.set(res, session);
    return session;
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.usersService.findMe(user.sub);
  }

  @Patch('me')
  update(@CurrentUser() user: AuthUser, @Body() body: UpdateUserDto) {
    return this.usersService.update(user.sub, body);
  }

  @Delete('me')
  async remove(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: CookieResponse,
  ) {
    await this.usersService.remove(user.sub);
    this.cookies.clear(res);
    return { deleted: true };
  }
}
