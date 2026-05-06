import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';

@Injectable()
export class WebhookService {
  private publisherClient: Redis;
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly redisService: RedisService) {
    this.publisherClient = this.redisService.getOrThrow('publisher');
  }

  async onModuleInit() {
    try {
      await Promise.race([
        this.publisherClient.connect(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Redis publisher connection timeout')),
            5000,
          ),
        ),
      ]);
      this.logger.log('Publisher connected to Redis');
    } catch (error) {
      this.logger.warn(
        `Publisher failed to connect to Redis: ${error.message}. Publishing disabled.`,
      );
    }
  }

  /**
   * Publish an event to a Redis channel
   * @param channel - Redis channel name
   * @param message - Message to be sent (string or object)
   */
  async publishEvent(channel: string, message: string | object): Promise<void> {
    const payload =
      typeof message === 'object' ? JSON.stringify(message) : message;

    try {
      await this.publisherClient.publish(channel, payload);
      this.logger.log(`Published message to channel "${channel}"`);
    } catch (error) {
      this.logger.error(
        `Failed to publish to channel "${channel}": ${error.message}`,
      );
    }
  }
}
