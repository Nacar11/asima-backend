import { Module } from '@nestjs/common';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { WebhookService } from '@/webhooks/webhook.service';
import { WebhookListenerService } from '@/webhooks/webhook-listener.service';

const redisHost: string = process.env.REDIS_HOST || 'localhost';
const redisPort: number = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisTls = process.env.REDIS_TLS === 'true' ? {} : undefined;

@Module({
  imports: [
    RedisModule.forRootAsync({
      useFactory: () => ({
        config: [
          {
            namespace: 'publisher',
            host: redisHost,
            port: redisPort,
            tls: redisTls,
            connectTimeout: 5000,
            maxRetriesPerRequest: 1,
            enableOfflineQueue: true,
            lazyConnect: true,
          },
          {
            namespace: 'subscriber',
            host: redisHost,
            port: redisPort,
            tls: redisTls,
            connectTimeout: 5000,
            maxRetriesPerRequest: 1,
            enableOfflineQueue: true,
            lazyConnect: true,
          },
        ],
      }),
    }),
  ],
  providers: [WebhookService, WebhookListenerService],
  exports: [WebhookService],
})
export class WebhookModule {}
