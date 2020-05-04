import { createHandyClient, IHandyRedis } from 'handy-redis';

const redisClient: IHandyRedis = createHandyClient({
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASS || '86a2fa7bbc75b6f56fbf2ca8f09bde1bb3e9f2db'
});

export default redisClient;