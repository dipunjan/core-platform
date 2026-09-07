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
  ACCESS_COOKIE,
  AuthCookieService,
  CurrentUser,
  Public,
  REFRESH_COOKIE,
  TokenDenylist,
  readCookie,
  sessionForClient,
  wantsJsonTokens,
  type AuthUser,
  type CookieResponse,
} from '@core-platform/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UsersService } from './users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cookies: AuthCookieService,
    private readonly denylist: TokenDenylist,
    private readonly jwt: JwtService,
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
    @Req() req: { headers: { authorization?: string; cookie?: string } },
    @Res({ passthrough: true }) res: CookieResponse,
  ) {
    const access =
      bearerToken(req.headers.authorization) ??
      readCookie(req.headers.cookie, ACCESS_COOKIE);
    if (access) {
      await this.denylist.revoke(access, ttlSeconds(this.jwt, access));
    }
    await this.usersService.logout(user.sub);
    this.cookies.clear(res);
    return { loggedOut: true };
  }
}

function bearerToken(header: string | undefined): string | undefined {
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return undefined;
}

function ttlSeconds(jwt: JwtService, token: string): number {
  const payload = jwt.decode<{ exp?: number }>(token);
  if (payload?.exp) {
    return Math.max(1, payload.exp - Math.floor(Date.now() / 1000));
  }
  return 15 * 60;
}
