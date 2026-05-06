import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringController } from '@/monitoring/monitoring.controller';
import { MetricsService } from '@/monitoring/services/metrics.service';
import { HealthCheckService } from '@/monitoring/services/health-check.service';
import { LogReaderService } from '@/monitoring/services/log-reader.service';
import { LoggingInterceptor } from '@/monitoring/interceptors/logging.interceptor';
import { LoggersModule } from '@/loggers/loggers.module';

/**
 * Monitoring Module.
 *
 * Provides system monitoring, metrics collection, health checks, and log viewing for admins.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [TypeOrmModule, LoggersModule],
  controllers: [MonitoringController],
  providers: [
    MetricsService,
    HealthCheckService,
    LogReaderService,
    LoggingInterceptor,
  ],
  exports: [MetricsService, HealthCheckService, LoggingInterceptor],
})
export class MonitoringModule {}
