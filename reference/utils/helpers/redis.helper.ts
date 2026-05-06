import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisHelper {
  private redisClient: Redis;
  private readonly logger = new Logger(RedisHelper.name);
  private isConnected = false;

  constructor() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost', // Default to localhost
      port: Number(process.env.REDIS_PORT) || 6379, // Default to port 6379
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB) || 0, // Default to db 0
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        this.logger.warn(
          `Redis connection retry attempt ${times}, retrying in ${delay}ms`,
        );
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true, // Changed to true to prevent immediate connection attempts
      enableOfflineQueue: true,
    });

    // Log connection events
    this.redisClient.on('connect', () => {
      this.isConnected = true;
      this.logger.log('Successfully connected to Redis');
    });

    this.redisClient.on('ready', () => {
      this.isConnected = true;
      this.logger.log('Redis client is ready');
    });

    this.redisClient.on('error', (error) => {
      this.isConnected = false;
      // Only log error details, not the full error object to avoid logging sensitive data
      this.logger.error(
        `Redis connection error: ${error.message || 'Unknown error'}`,
      );
    });

    this.redisClient.on('close', () => {
      this.isConnected = false;
      this.logger.warn('Redis connection closed');
    });

    this.redisClient.on('reconnecting', () => {
      this.logger.warn('Redis client reconnecting...');
    });
  }

  // Method to check if Redis is connected (for logging/warning purposes only)
  private checkConnection(): boolean {
    // Check actual Redis client status if available (for real instances)
    const status = (this.redisClient as any).status;
    if (status !== undefined) {
      // Redis client statuses: 'wait', 'end', 'ready', 'connect', 'reconnecting'
      const connectedStatuses = ['ready', 'connect'];
      if (!connectedStatuses.includes(status)) {
        this.logger.warn(
          `Redis operation attempted but client status is: ${status}`,
        );
        return false;
      }
    }
    // If status is not available (e.g., in mocks), assume connected
    // to allow tests to work properly
    return true;
  }

  // Method to get a value from Redis
  async get(key: string): Promise<string | null> {
    // Log warning if disconnected, but don't block operation
    // Let Redis handle connection errors naturally
    this.checkConnection();
    try {
      return await this.redisClient.get(key);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get key ${key} from Redis: ${errorMessage}`);
      return null;
    }
  }

  // Method to set a value in Redis
  async set(key: string, value: string, ttl?: number): Promise<string> {
    // Log warning if disconnected, but don't block operation
    // Let Redis handle connection errors naturally
    this.checkConnection();
    try {
      if (ttl) {
        await this.redisClient.setex(key, ttl, value); // TTL in seconds
      } else {
        await this.redisClient.set(key, value);
      }
      return value;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to set key ${key} in Redis: ${errorMessage}`);
      throw error;
    }
  }

  // Method to delete a value from Redis
  async del(key: string): Promise<number> {
    try {
      return await this.redisClient.del(key);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to delete key ${key} from Redis: ${errorMessage}`,
      );
      return 0;
    }
  }

  // Method to check if a key exists
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to check existence of key ${key} in Redis: ${errorMessage}`,
      );
      return false;
    }
  }

  // Method to close the Redis connection
  async quit(): Promise<void> {
    try {
      await this.redisClient.quit();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to quit Redis connection: ${errorMessage}`);
    }
  }

  async geoAdd(
    key: string,
    latitude: number,
    longitude: number,
    user_id: string,
  ): Promise<void> {
    try {
      await this.redisClient.geoadd(key, longitude, latitude, user_id);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to add geolocation to Redis: ${errorMessage}`);
    }
  }

  async geoPos(
    key: string,
    user_ids: string[],
  ): Promise<([string, string] | null)[]> {
    return await this.redisClient.geopos(key, ...user_ids);
  }

  async publish(key: string, message: string): Promise<void> {
    try {
      await this.redisClient.publish(key, message);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to publish message to Redis: ${errorMessage}`);
    }
  }

  async getMembers(key: string): Promise<string[]> {
    return await this.redisClient.zrange(key, 0, -1);
  }

  async zIncrBy(
    key: string,
    increment: number,
    member: string,
  ): Promise<number | null> {
    try {
      const result = await this.redisClient.zincrby(key, increment, member);
      return Number(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to increment score in sorted set for key ${key}: ${errorMessage}`,
      );
      return null;
    }
  }

  async zRevRange(
    key: string,
    start: number,
    stop: number,
  ): Promise<{ member: string; score: number }[]> {
    try {
      const raw = await this.redisClient.zrevrange(
        key,
        start,
        stop,
        'WITHSCORES',
      );

      const result: { member: string; score: number }[] = [];
      for (let i = 0; i < raw.length; i += 2) {
        result.push({ member: raw[i], score: Number(raw[i + 1]) });
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to get sorted set members for key ${key}: ${errorMessage}`,
      );
      return [];
    }
  }

  /**
   * Delete all keys matching a pattern using SCAN (non-blocking)
   * @param pattern - Redis pattern (e.g., "featured_products:*")
   * @returns Number of keys deleted
   */
  async delByPattern(pattern: string): Promise<number> {
    let cursor = '0';
    let deleted = 0;

    try {
      do {
        const [nextCursor, keys] = await this.redisClient.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;

        if (keys.length > 0) {
          deleted += await this.redisClient.del(...keys);
        }
      } while (cursor !== '0');

      return deleted;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to delete keys matching pattern ${pattern}: ${errorMessage}`,
      );
      return 0;
    }
  }
}
