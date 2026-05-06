import { Logger } from '@nestjs/common';
import { MayaWebhookMonitoringService } from '../../maya-webhook-monitoring.service';

describe('MayaWebhookMonitoringService', () => {
  const defaultConfig: Record<string, string> = {
    MAYA_WEBHOOK_RETRY_ENABLED: 'true',
    MAYA_WEBHOOK_RETRY_BATCH_SIZE: '20',
    MAYA_WEBHOOK_MAX_RETRIES: '3',
    MAYA_WEBHOOK_RETRY_DELAY_MINUTES: '10',
    MAYA_WEBHOOK_ALERT_WINDOW_MINUTES: '60',
    MAYA_WEBHOOK_ALERT_DUPLICATE_THRESHOLD: '1',
    MAYA_WEBHOOK_ALERT_FAILED_THRESHOLD: '1',
    MAYA_WEBHOOK_ALERT_LATENCY_MS_THRESHOLD: '5000',
  };

  const createService = (overrides?: {
    config?: Record<string, string>;
    events?: any[];
    reprocessError?: Error;
    metrics?: {
      windowStart: Date;
      duplicateCount: number;
      failedCount: number;
      avgProcessingLatencyMs: number;
    };
  }) => {
    const repo = {
      find: jest.fn().mockResolvedValue(overrides?.events || []),
      update: jest.fn().mockResolvedValue(undefined),
    };

    const checkoutPaymentsService = {
      reprocessMayaWebhookEventById: overrides?.reprocessError
        ? jest.fn().mockRejectedValue(overrides.reprocessError)
        : jest.fn().mockResolvedValue(undefined),
      getMayaWebhookMetricsSnapshot: jest.fn().mockResolvedValue(
        overrides?.metrics || {
          windowStart: new Date('2026-03-04T00:00:00.000Z'),
          duplicateCount: 0,
          failedCount: 0,
          avgProcessingLatencyMs: 0,
        },
      ),
    };

    const configMap = { ...defaultConfig, ...(overrides?.config || {}) };
    const configService = {
      get: jest.fn((key: string) => configMap[key]),
    };

    const service = new MayaWebhookMonitoringService(
      checkoutPaymentsService as any,
      configService as any,
      repo as any,
    );

    return { service, repo, checkoutPaymentsService };
  };

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('retries failed webhook events and calls reprocess', async () => {
    const event = {
      id: 101,
      retry_count: 0,
      status: 'failed',
      created_at: new Date(),
    };
    const { service, repo, checkoutPaymentsService } = createService({
      events: [event],
    });

    await service.retryFailedMayaWebhookEvents();

    expect(repo.find).toHaveBeenCalledTimes(1);
    expect(repo.update).toHaveBeenCalledWith(
      event.id,
      expect.objectContaining({
        retry_count: 1,
        status: 'pending',
      }),
    );
    expect(
      checkoutPaymentsService.reprocessMayaWebhookEventById,
    ).toHaveBeenCalledWith(event.id);
  });

  it('schedules next retry when reprocess fails before max retries', async () => {
    const event = {
      id: 202,
      retry_count: 0,
      status: 'failed',
      created_at: new Date(),
    };
    const { service, repo } = createService({
      events: [event],
      reprocessError: new Error('transient failure'),
    });

    await service.retryFailedMayaWebhookEvents();

    expect(repo.update).toHaveBeenNthCalledWith(
      1,
      event.id,
      expect.objectContaining({
        retry_count: 1,
        status: 'pending',
      }),
    );
    expect(repo.update).toHaveBeenNthCalledWith(
      2,
      event.id,
      expect.objectContaining({
        status: 'failed',
        error_message: 'transient failure',
        next_retry_at: expect.any(Date),
      }),
    );
  });

  it('marks event exhausted when max retries is reached', async () => {
    const event = {
      id: 303,
      retry_count: 2,
      status: 'failed',
      created_at: new Date(),
    };
    const { service, repo } = createService({
      events: [event],
      reprocessError: new Error('permanent failure'),
    });

    await service.retryFailedMayaWebhookEvents();

    expect(repo.update).toHaveBeenNthCalledWith(
      2,
      event.id,
      expect.objectContaining({
        status: 'failed',
        error_message: '[MAX_RETRIES_REACHED] permanent failure',
        next_retry_at: null,
      }),
    );
  });

  it('emits alert logs when webhook metrics cross thresholds', async () => {
    const { service, checkoutPaymentsService } = createService({
      metrics: {
        windowStart: new Date('2026-03-04T00:00:00.000Z'),
        duplicateCount: 2,
        failedCount: 3,
        avgProcessingLatencyMs: 6001,
      },
    });

    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    await service.monitorMayaWebhookHealth();

    expect(
      checkoutPaymentsService.getMayaWebhookMetricsSnapshot,
    ).toHaveBeenCalledWith(60);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Maya duplicate webhook alert triggered'),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Maya latency alert triggered'),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Maya failed webhook alert triggered'),
    );
  });
});
