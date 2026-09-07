import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import type Redis from 'ioredis';
import { REDIS_CLIENT, redisKeys } from './redis.keys';

@Injectable()
export class TokenDenylist {
  private readonly log = new Logger(TokenDenylist.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async revoke(accessToken: string, ttlSeconds: number): Promise<void> {
    if (!accessToken || ttlSeconds <= 0) {
      return;
    }
    try {
      await this.redis.set(
        redisKeys.deny(hashToken(accessToken)),
        '1',
        'EX',
        ttlSeconds,
      );
    } catch (err) {
      this.log.warn(`Could not record logout in Redis: ${String(err)}`);
    }
  }

  async isRevoked(accessToken: string): Promise<boolean> {
    try {
      const hit = await this.redis.get(redisKeys.deny(hashToken(accessToken)));
      return hit === '1';
    } catch (err) {
      this.log.warn(
        `Denylist check skipped (${String(err)}). JWT signature still applies.`,
      );
      return false;
    }
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
