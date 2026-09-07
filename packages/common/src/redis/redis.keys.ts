export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisKeys = {
  throttle: (key: string) => `swoop:throttle:${key}`,
  deny: (hash: string) => `swoop:deny:${hash}`,
  catalogGen: 'swoop:catalog:gen',
  catalog: (gen: string, name: string) => `swoop:catalog:${gen}:${name}`,
};
