import { Inject, Injectable, Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT, redisKeys } from './redis.keys';

const CATALOG_TTL_SECONDS = 45;

@Injectable()
export class CatalogCache {
  private readonly log = new Logger(CatalogCache.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async getJson<T>(name: string): Promise<T | null> {
    try {
      const gen = (await this.redis.get(redisKeys.catalogGen)) ?? '0';
      const raw = await this.redis.get(redisKeys.catalog(gen, name));
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as T;
    } catch (err) {
      this.log.warn(`Catalog cache read skipped: ${String(err)}`);
      return null;
    }
  }

  async setJson(name: string, value: unknown): Promise<void> {
    try {
      const gen = (await this.redis.get(redisKeys.catalogGen)) ?? '0';
      await this.redis.set(
        redisKeys.catalog(gen, name),
        JSON.stringify(value),
        'EX',
        CATALOG_TTL_SECONDS,
      );
    } catch (err) {
      this.log.warn(`Catalog cache write skipped: ${String(err)}`);
    }
  }

  async bump(): Promise<void> {
    try {
      await this.redis.incr(redisKeys.catalogGen);
    } catch (err) {
      this.log.warn(`Catalog cache bump skipped: ${String(err)}`);
    }
  }
}
