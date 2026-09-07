import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  AuthCookieService,
  CurrentUser,
  Public,
  Roles,
  sessionForClient,
  wantsJsonTokens,
  type AuthUser,
  type CookieResponse,
} from '@core-platform/common';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateManagedUserDto } from './dto/update-managed-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cookies: AuthCookieService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  async create(
    @Body() body: CreateUserDto,
    @Req() req: { headers: Record<string, string | string[] | undefined> },
    @Res({ passthrough: true }) res: CookieResponse,
  ) {
    const session = await this.usersService.create(body);
    this.cookies.set(res, session);
    return sessionForClient(session, wantsJsonTokens(req.headers));
  }

  @Roles('admin')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Roles('admin')
  @Post('managed')
  createManaged(@Body() body: CreateManagedUserDto) {
    return this.usersService.createManaged(body);
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

  @Roles('admin')
  @Patch(':id')
  updateManaged(@Param('id') id: string, @Body() body: UpdateManagedUserDto) {
    return this.usersService.updateManaged(id, body);
  }

  @Roles('admin')
  @Patch(':id/role')
  updateRole(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(id, body, actor.sub);
  }

  @Roles('admin')
  @Delete(':id')
  async removeManaged(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
  ) {
    await this.usersService.removeManaged(id, actor.sub);
    return { deleted: true };
  }
}
