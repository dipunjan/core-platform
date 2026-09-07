import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { timingSafeEqual } from 'crypto';
import {
  ACCESS_COOKIE,
  CSRF_COOKIE,
  CSRF_HEADER,
  readCookie,
} from './auth-cookies';
import type { AuthUser } from './auth.types';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      method: string;
      headers: {
        authorization?: string;
        cookie?: string;
        [key: string]: string | string[] | undefined;
      };
      user?: AuthUser;
    }>();
    const fromHeader = bearerToken(request.headers.authorization);
    const token = fromHeader ?? readCookie(request.headers.cookie, ACCESS_COOKIE);
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = this.jwt.verify<AuthUser & { typ?: string; role?: string }>(
        token,
      );
      if (payload.typ && payload.typ !== 'access') {
        throw new UnauthorizedException();
      }
      if (!fromHeader) {
        assertCsrf(request.method, request.headers);
      }
      request.user = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role === 'admin' ? 'admin' : 'customer',
      };
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException();
    }
  }
}

function bearerToken(header: string | undefined): string | undefined {
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return undefined;
}

function assertCsrf(
  method: string,
  headers: {
    cookie?: string;
    [key: string]: string | string[] | undefined;
  },
): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    return;
  }
  const cookie = readCookie(headers.cookie, CSRF_COOKIE);
  const raw = headers[CSRF_HEADER];
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (!cookie || !header || !sameSecret(cookie, header)) {
    throw new ForbiddenException('Invalid CSRF token');
  }
}

function sameSecret(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
