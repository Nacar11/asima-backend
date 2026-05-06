import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { SystemAdminGuard } from '@/users/user.guard';
import { SystemAdmin } from '@/users/users.decorator';
import { MetricsService } from '@/monitoring/services/metrics.service';
import { HealthCheckService } from '@/monitoring/services/health-check.service';
import { LogReaderService } from '@/monitoring/services/log-reader.service';
import { QueryLogsDto } from '@/monitoring/dto/query-logs.dto';
import { QueryMetricsDto } from '@/monitoring/dto/query-metrics.dto';
import { StructuredLogEntry } from '@/loggers/loggers.interface';
import { SystemMetric } from '@/monitoring/services/metrics.service';
import { HealthStatus } from '@/monitoring/services/health-check.service';

/**
 * Admin Monitoring Controller.
 *
 * Provides admin endpoints for viewing logs, metrics, and health status.
 *
 * @version 1
 * @since 1.0.0
 */
@ApiTags('Admin - Monitoring')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), SystemAdminGuard)
@SystemAdmin(true)
@Controller({
  path: 'admin',
  version: '1',
})
export class MonitoringController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly healthCheckService: HealthCheckService,
    private readonly logReaderService: LogReaderService,
  ) {}

  @Get('logs')
  @ApiOperation({
    summary: 'Get application logs',
    description:
      'Retrieve application logs with optional filters (level, date range, user, endpoint)',
  })
  @ApiOkResponse({
    description: 'List of log entries',
    type: [Object],
  })
  getLogs(@Query() query: QueryLogsDto): Promise<StructuredLogEntry[]> {
    const startDate = query.start_date ? new Date(query.start_date) : undefined;
    const endDate = query.end_date ? new Date(query.end_date) : undefined;

    return this.logReaderService.readLogs({
      level: query.level,
      startDate,
      endDate,
      userId: query.user_id,
      endpoint: query.endpoint,
      limit: query.limit || 100,
    });
  }

  @Get('errors')
  @ApiOperation({
    summary: 'Get error logs',
    description: 'Retrieve error and fatal logs only',
  })
  @ApiOkResponse({
    description: 'List of error log entries',
    type: [Object],
  })
  getErrors(@Query('limit') limit?: number): Promise<StructuredLogEntry[]> {
    return this.logReaderService.getErrorLogs(limit || 100);
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'Get system metrics',
    description:
      'Retrieve system performance metrics (CPU, memory, requests, errors, response times)',
  })
  @ApiOkResponse({
    description: 'System metrics',
  })
  getMetrics(@Query() query: QueryMetricsDto): {
    current?: SystemMetric;
    history: SystemMetric[];
    summary: ReturnType<MetricsService['getMetricsSummary']>;
  } {
    const startDate = query.start_date ? new Date(query.start_date) : undefined;
    const endDate = query.end_date ? new Date(query.end_date) : undefined;

    const current = this.metricsService.getCurrentMetrics();
    return {
      current: current || undefined,
      history: this.metricsService.getMetricsHistory(
        query.limit || 100,
        startDate,
        endDate,
      ),
      summary: this.metricsService.getMetricsSummary(),
    };
  }

  @Get('health')
  @ApiOperation({
    summary: 'Get system health status',
    description:
      'Check system health including database connectivity and memory usage',
  })
  @ApiOkResponse({
    description: 'System health status',
    type: Object,
  })
  getHealth(): Promise<HealthStatus> {
    return this.healthCheckService.checkHealth();
  }

  @Get('logs/stats')
  @ApiOperation({
    summary: 'Get log statistics',
    description: 'Get count of logs by level',
  })
  @ApiOkResponse({
    description: 'Log counts by level',
  })
  getLogStats(): Promise<Record<string, number>> {
    return this.logReaderService.getLogsCount();
  }
}
