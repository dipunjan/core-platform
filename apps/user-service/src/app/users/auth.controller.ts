import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  AuthCookieService,
  CurrentUser,
  Public,
  REFRESH_COOKIE,
  readCookie,
  sessionForClient,
  wantsJsonTokens,
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
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Req() req: { headers: Record<string, string | string[] | undefined> },
    @Res({ passthrough: true }) res: CookieResponse,
  ) {
    const session = await this.usersService.login(body);
    this.cookies.set(res, session);
    return sessionForClient(session, wantsJsonTokens(req.headers));
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('refresh')
  async refresh(
    @Body() body: RefreshTokenDto,
    @Req() req: { headers: { cookie?: string } & Record<string, string | string[] | undefined> },
    @Res({ passthrough: true }) res: CookieResponse,
  ) {
    const refreshToken =
      body.refreshToken ?? readCookie(req.headers.cookie, REFRESH_COOKIE);
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const session = await this.usersService.refresh(refreshToken);
    this.cookies.set(res, session);
    return sessionForClient(session, wantsJsonTokens(req.headers));
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
