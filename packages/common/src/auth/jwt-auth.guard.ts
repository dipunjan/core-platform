import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_COOKIE, readCookie } from './auth-cookies';
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
      headers: { authorization?: string; cookie?: string };
      user?: AuthUser;
    }>();
    const token = accessTokenFromRequest(request);
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = this.jwt.verify<AuthUser & { typ?: string }>(token);
      if (payload.typ && payload.typ !== 'access') {
        throw new UnauthorizedException();
      }
      request.user = { sub: payload.sub, email: payload.email };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}

function accessTokenFromRequest(request: {
  headers: { authorization?: string; cookie?: string };
}): string | undefined {
  const header = request.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return readCookie(request.headers.cookie, ACCESS_COOKIE);
}
