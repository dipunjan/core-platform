import { Logger } from '@nestjs/common';
import type { ThrottlerStorage, ThrottlerStorageRecord } from '@nestjs/throttler';
import type Redis from 'ioredis';
import { redisKeys } from './redis.keys';

export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly log = new Logger(RedisThrottlerStorage.name);

  constructor(private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    _limit: number,
    _blockDuration: number,
    _throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const redisKey = redisKeys.throttle(key);
    try {
      const hits = await this.redis.incr(redisKey);
      if (hits === 1) {
        await this.redis.pexpire(redisKey, Math.max(ttl, 1));
      }
      const pttl = await this.redis.pttl(redisKey);
      return {
        totalHits: hits,
        timeToExpire: Math.max(pttl, 0),
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    } catch (err) {
      this.log.warn(
        `Throttle counter unavailable (${String(err)}). Allowing the request.`,
      );
      return {
        totalHits: 0,
        timeToExpire: ttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }
}
