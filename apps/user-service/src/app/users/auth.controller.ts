import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AuthCookieService,
  CurrentUser,
  Public,
  REFRESH_COOKIE,
  readCookie,
  type AuthUser,
  type CookieResponse,
} from '@core-platform/common';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UsersService } from './users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cookies: AuthCookieService,
  ) {}

  @Public()
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: CookieResponse,
  ) {
    const session = await this.usersService.login(body);
    this.cookies.set(res, session);
    return session;
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Body() body: RefreshTokenDto,
    @Req() req: { headers: { cookie?: string } },
    @Res({ passthrough: true }) res: CookieResponse,
  ) {
    const refreshToken =
      body.refreshToken ?? readCookie(req.headers.cookie, REFRESH_COOKIE);
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const session = await this.usersService.refresh(refreshToken);
    this.cookies.set(res, session);
    return session;
  }

  @Post('logout')
  async logout(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: CookieResponse,
  ) {
    await this.usersService.logout(user.sub);
    this.cookies.clear(res);
    return { loggedOut: true };
  }
}
