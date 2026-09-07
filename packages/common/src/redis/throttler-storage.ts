import { Logger } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type Redis from 'ioredis';
import { redisKeys } from './redis.keys';

type ThrottleRecord = {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
};

export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly log = new Logger(RedisThrottlerStorage.name);

  constructor(private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    _limit: number,
    _blockDuration: number,
    _throttlerName: string,
  ): Promise<ThrottleRecord> {
    const redisKey = redisKeys.throttle(key);
    try {
      const hits = await this.redis
        .multi()
        .incr(redisKey)
        .pttl(redisKey)
        .exec();
      const count = Number(hits?.[0]?.[1] ?? 0);
      let pttl = Number(hits?.[1]?.[1] ?? -1);
      if (count === 1 || pttl < 0) {
        await this.redis.pexpire(redisKey, Math.max(ttl, 1));
        pttl = await this.redis.pttl(redisKey);
      }
      return {
        totalHits: count,
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
