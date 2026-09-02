import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '@core-platform/common';
import { LoginDto } from './dto/login.dto';
import { UsersService } from './users.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.usersService.login(body);
  }
}
