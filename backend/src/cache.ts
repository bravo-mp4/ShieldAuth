// Redis Cache Configuration
import { createClient } from 'redis';
import logger from './logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = createClient({
  url: REDIS_URL
});

redis.on('error', (err) => logger.error('Redis Client Error:', err));
redis.on('connect', () => logger.info('Redis connected successfully'));

export const connectRedis = async () => {
  try {
    await redis.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
  }
};

// Cache helpers
export const cacheGet = async (key: string) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Cache get error for key ${key}:`, error);
    return null;
  }
};

export const cacheSet = async (key: string, value: any, ttlSeconds: number = 300) => {
  try {
    await redis.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    logger.error(`Cache set error for key ${key}:`, error);
  }
};

export const cacheDelete = async (key: string) => {
  try {
    await redis.del(key);
  } catch (error) {
    logger.error(`Cache delete error for key ${key}:`, error);
  }
};

export const cacheInvalidatePattern = async (pattern: string) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    logger.error(`Cache invalidate pattern error for ${pattern}:`, error);
  }
};

export default redis;
