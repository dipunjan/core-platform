import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser, Public, type AuthUser } from '@core-platform/common';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UsersService } from './users.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.usersService.login(body);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() body: RefreshTokenDto) {
    return this.usersService.refresh(body.refreshToken);
  }

  @Post('logout')
  async logout(@CurrentUser() user: AuthUser) {
    await this.usersService.logout(user.sub);
    return { loggedOut: true };
  }
}
