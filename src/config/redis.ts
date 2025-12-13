import { createClient } from 'redis';
import { env } from './env';
import { logger } from '@/utils/logger';

let redisClient: ReturnType<typeof createClient> | null = null;

export const connectRedis = async () => {
  if (!env.REDIS_URL) {
    logger.warn('Redis URL not configured. Cache will be disabled.');
    return null;
  }

  try {
    redisClient = createClient({
      url: env.REDIS_URL,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    return null;
  }
};

export const getRedisClient = () => redisClient;

export const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis disconnected');
  }
};

