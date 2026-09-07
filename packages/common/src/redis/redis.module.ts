import { Global, Inject, Logger, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CatalogCache } from './catalog-cache';
import { REDIS_CLIENT } from './redis.keys';
import { TokenDenylist } from './token-denylist';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
        const client = new Redis(url, {
          maxRetriesPerRequest: 1,
          connectTimeout: 3_000,
          enableOfflineQueue: false,
        });
        const log = new Logger('Redis');
        client.on('error', (err) => {
          log.warn(`Redis error: ${err.message}`);
        });
        return client;
      },
    },
    TokenDenylist,
    CatalogCache,
  ],
  exports: [REDIS_CLIENT, TokenDenylist, CatalogCache],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
