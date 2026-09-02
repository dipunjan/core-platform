import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser, Public, type AuthUser } from '@core-platform/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
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
  async remove(@CurrentUser() user: AuthUser) {
    await this.usersService.remove(user.sub);
    return { deleted: true };
  }
}
