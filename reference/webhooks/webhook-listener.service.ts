import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

@Injectable()
export class WebhookListenerService {
  private listenerClient: Redis;
  private readonly logger = new Logger(WebhookListenerService.name);

  constructor(private readonly redisService: RedisService) {
    this.listenerClient = this.redisService.getOrThrow('subscriber');
  }

  async onModuleInit() {
    try {
      this.logger.log('Initializing Redis connection...');

      // Check if already connected or connecting
      const status = this.listenerClient.status;
      this.logger.debug(`Current Redis status: ${status}`);

      if (status === 'ready' || status === 'connect') {
        this.logger.log('Redis already connected');
      } else if (status === 'connecting') {
        this.logger.log('Redis is connecting, waiting...');
        // Wait for the connection to be ready
        await Promise.race([
          new Promise((resolve) => {
            this.listenerClient.once('ready', resolve);
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Redis ready timeout')), 5000),
          ),
        ]);
      } else {
        this.logger.log('Connecting to Redis...');
        await Promise.race([
          this.listenerClient.connect(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Redis connection timeout')),
              5000,
            ),
          ),
        ]);
      }

      this.logger.log('Redis is ready, subscribing to channel...');

      // Now subscribe to the channel with timeout
      await Promise.race([
        this.listenerClient.subscribe('driver-location'),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Redis subscribe timeout after 5s')),
            5000,
          ),
        ),
      ]);

      this.logger.log('Successfully subscribed to driver-location');

      // Handle incoming messages
      this.listenerClient.on('message', (channel, message) => {
        this.logger.debug(`Received message from channel "${channel}": ${message}`);
      });
    } catch (error) {
      this.logger.warn(
        `Failed to connect/subscribe to Redis: ${error.message}. Webhooks disabled.`,
      );
      // Don't throw - allow app to continue without webhooks
    }
  }
}
