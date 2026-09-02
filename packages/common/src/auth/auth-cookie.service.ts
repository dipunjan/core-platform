import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  type CookieResponse,
  durationToMs,
} from './auth-cookies';

@Injectable()
export class AuthCookieService {
  constructor(private readonly config: ConfigService) {}

  set(
    res: CookieResponse,
    tokens: { accessToken: string; refreshToken: string },
  ): void {
    const secure = this.secure();
    const accessMaxAge = durationToMs(
      this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m',
    );
    const refreshMaxAge = durationToMs(
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    );
    res.cookie(ACCESS_COOKIE, tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: accessMaxAge,
    });
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: refreshMaxAge,
    });
  }

  clear(res: CookieResponse): void {
    const secure = this.secure();
    const base = { httpOnly: true, secure, sameSite: 'lax' as const };
    res.clearCookie(ACCESS_COOKIE, { ...base, path: '/' });
    res.clearCookie(REFRESH_COOKIE, { ...base, path: '/api/auth' });
  }

  private secure(): boolean {
    const flag = this.config.get<string>('COOKIE_SECURE');
    if (flag === 'true') {
      return true;
    }
    if (flag === 'false') {
      return false;
    }
    return (this.config.get<string>('NODE_ENV') ?? 'development') === 'production';
  }
}
