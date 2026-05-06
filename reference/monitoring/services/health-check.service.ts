import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ApplicationLoggerService } from '@/loggers/services/application.logger.service';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
    };
    memory: {
      status: 'up' | 'down';
      usage: number;
    };
    disk?: {
      status: 'up' | 'down';
      usage: number;
    };
  };
}

@Injectable()
export class HealthCheckService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: ApplicationLoggerService,
  ) {}

  /**
   * Perform health check.
   */
  async checkHealth(): Promise<HealthStatus> {
    const checks: HealthStatus['checks'] = {
      database: await this.checkDatabase(),
      memory: this.checkMemory(),
    };

    const allUp = Object.values(checks).every((check) => check.status === 'up');
    const anyDegraded = Object.values(checks).some(
      (check) => check.status === 'down',
    );

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (allUp) {
      status = 'healthy';
    } else if (anyDegraded) {
      status = 'unhealthy';
    } else {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date(),
      checks,
    };
  }

  /**
   * Check database connectivity.
   */
  private async checkDatabase(): Promise<{
    status: 'up' | 'down';
    responseTime?: number;
  }> {
    try {
      const startTime = Date.now();
      await this.dataSource.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      return {
        status: 'up',
        responseTime,
      };
    } catch (error) {
      this.logger.error('Database health check failed', error.stack);
      return {
        status: 'down',
      };
    }
  }

  /**
   * Check memory usage.
   */
  private checkMemory(): {
    status: 'up' | 'down';
    usage: number;
  } {
    const usage = process.memoryUsage();
    const totalMemory = usage.heapTotal;
    const usedMemory = usage.heapUsed;
    const usagePercent = totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0;

    // Consider memory usage > 90% as down
    const status = usagePercent > 90 ? 'down' : 'up';

    return {
      status,
      usage: usagePercent,
    };
  }
}
