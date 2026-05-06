import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, LessThanOrEqual, Repository } from 'typeorm';
import { MayaWebhookEventEntity } from './persistence/entities/maya-webhook-event.entity';
import { CheckoutPaymentsService } from './checkout-payments.service';

@Injectable()
export class MayaWebhookMonitoringService {
  private readonly logger = new Logger(MayaWebhookMonitoringService.name);

  private readonly retryEnabled: boolean;
  private readonly retryBatchSize: number;
  private readonly maxRetries: number;
  private readonly retryDelayMinutes: number;
  private readonly alertWindowMinutes: number;
  private readonly duplicateAlertThreshold: number;
  private readonly failedAlertThreshold: number;
  private readonly latencyAlertThresholdMs: number;

  constructor(
    private readonly checkoutPaymentsService: CheckoutPaymentsService,
    private readonly configService: ConfigService,
    @InjectRepository(MayaWebhookEventEntity)
    private readonly mayaWebhookEventRepository: Repository<MayaWebhookEventEntity>,
  ) {
    this.retryEnabled = this.parseBoolean(
      this.configService.get('MAYA_WEBHOOK_RETRY_ENABLED', { infer: true }),
      true,
    );
    this.retryBatchSize = this.parsePositiveInt(
      this.configService.get('MAYA_WEBHOOK_RETRY_BATCH_SIZE', {
        infer: true,
      }),
      20,
    );
    this.maxRetries = this.parsePositiveInt(
      this.configService.get('MAYA_WEBHOOK_MAX_RETRIES', { infer: true }),
      3,
    );
    this.retryDelayMinutes = this.parsePositiveInt(
      this.configService.get('MAYA_WEBHOOK_RETRY_DELAY_MINUTES', {
        infer: true,
      }),
      10,
    );
    this.alertWindowMinutes = this.parsePositiveInt(
      this.configService.get('MAYA_WEBHOOK_ALERT_WINDOW_MINUTES', {
        infer: true,
      }),
      60,
    );
    this.duplicateAlertThreshold = this.parsePositiveInt(
      this.configService.get('MAYA_WEBHOOK_ALERT_DUPLICATE_THRESHOLD', {
        infer: true,
      }),
      1,
    );
    this.failedAlertThreshold = this.parsePositiveInt(
      this.configService.get('MAYA_WEBHOOK_ALERT_FAILED_THRESHOLD', {
        infer: true,
      }),
      1,
    );
    this.latencyAlertThresholdMs = this.parsePositiveInt(
      this.configService.get('MAYA_WEBHOOK_ALERT_LATENCY_MS_THRESHOLD', {
        infer: true,
      }),
      5000,
    );
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailedMayaWebhookEvents(): Promise<void> {
    if (!this.retryEnabled) {
      return;
    }

    const now = new Date();
    const candidates = await this.mayaWebhookEventRepository.find({
      where: [
        {
          status: 'failed',
          retry_count: LessThan(this.maxRetries),
          next_retry_at: IsNull(),
        },
        {
          status: 'failed',
          retry_count: LessThan(this.maxRetries),
          next_retry_at: LessThanOrEqual(now),
        },
      ],
      order: { created_at: 'ASC' },
      take: this.retryBatchSize,
    });

    if (candidates.length === 0) {
      return;
    }

    this.logger.log(
      `Retrying ${candidates.length} failed Maya webhook event(s)...`,
    );

    let retriedCount = 0;
    let exhaustedCount = 0;

    for (const event of candidates) {
      const nextAttempt = (event.retry_count || 0) + 1;
      await this.mayaWebhookEventRepository.update(event.id, {
        retry_count: nextAttempt,
        status: 'pending',
        error_message: null,
        next_retry_at: null,
      });

      try {
        await this.checkoutPaymentsService.reprocessMayaWebhookEventById(
          event.id,
        );
        retriedCount++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (nextAttempt >= this.maxRetries) {
          exhaustedCount++;
          await this.mayaWebhookEventRepository.update(event.id, {
            status: 'failed',
            error_message: `[MAX_RETRIES_REACHED] ${message}`,
            next_retry_at: null,
          });
        } else {
          const nextRetryAt = this.computeNextRetryAt(nextAttempt);
          await this.mayaWebhookEventRepository.update(event.id, {
            status: 'failed',
            error_message: message,
            next_retry_at: nextRetryAt,
          });
        }
      }
    }

    this.logger.log(
      `Maya webhook retry cycle done: retried=${retriedCount}, exhausted=${exhaustedCount}.`,
    );
  }

  @Cron('*/10 * * * *')
  async monitorMayaWebhookHealth(): Promise<void> {
    const metrics =
      await this.checkoutPaymentsService.getMayaWebhookMetricsSnapshot(
        this.alertWindowMinutes,
      );

    this.logger.log(
      `Maya webhook metrics (${this.alertWindowMinutes}m): duplicate_count=${metrics.duplicateCount}, failed_count=${metrics.failedCount}, avg_latency_ms=${metrics.avgProcessingLatencyMs}.`,
    );

    if (metrics.duplicateCount >= this.duplicateAlertThreshold) {
      this.logger.warn(
        `Maya duplicate webhook alert triggered: count=${metrics.duplicateCount}, threshold=${this.duplicateAlertThreshold}, window_start=${metrics.windowStart.toISOString()}`,
      );
    }

    if (metrics.failedCount >= this.failedAlertThreshold) {
      this.logger.error(
        `Maya failed webhook alert triggered: count=${metrics.failedCount}, threshold=${this.failedAlertThreshold}`,
      );
    }

    if (metrics.avgProcessingLatencyMs >= this.latencyAlertThresholdMs) {
      this.logger.warn(
        `Maya latency alert triggered: avg_latency_ms=${metrics.avgProcessingLatencyMs}, threshold_ms=${this.latencyAlertThresholdMs}, window_start=${metrics.windowStart.toISOString()}`,
      );
    }
  }

  private computeNextRetryAt(attempt: number): Date {
    const minutes = this.retryDelayMinutes * Math.max(1, attempt);
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  private parseBoolean(value: unknown, defaultValue: boolean): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1') {
        return true;
      }
      if (normalized === 'false' || normalized === '0') {
        return false;
      }
    }
    return defaultValue;
  }

  private parsePositiveInt(value: unknown, defaultValue: number): number {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
    return defaultValue;
  }
}
