import { Injectable, OnModuleInit } from '@nestjs/common';
import { ApplicationLoggerService } from '@/loggers/services/application.logger.service';

export interface SystemMetric {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
}

@Injectable()
export class MetricsService implements OnModuleInit {
  private metrics: SystemMetric[] = [];
  private requestCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];
  private readonly MAX_METRICS_HISTORY = 1000; // Keep last 1000 metrics
  private readonly MAX_RESPONSE_TIMES = 100; // Keep last 100 response times

  constructor(private readonly logger: ApplicationLoggerService) {}

  onModuleInit() {
    // Start collecting metrics every 60 seconds
    this.startMetricsCollection();
  }

  /**
   * Start periodic metrics collection.
   */
  private startMetricsCollection() {
    setInterval(() => {
      this.collectMetrics();
    }, 60000); // Collect every 60 seconds
  }

  /**
   * Collect current system metrics.
   */
  private collectMetrics() {
    try {
      const cpuUsage = this.getCpuUsage();
      const memoryUsage = this.getMemoryUsage();
      const averageResponseTime = this.calculateAverageResponseTime();

      const metric: SystemMetric = {
        timestamp: new Date(),
        cpuUsage,
        memoryUsage,
        activeConnections: 0, // TODO: Track active connections if needed
        requestCount: this.requestCount,
        errorCount: this.errorCount,
        averageResponseTime,
      };

      this.metrics.push(metric);

      // Keep only last MAX_METRICS_HISTORY metrics
      if (this.metrics.length > this.MAX_METRICS_HISTORY) {
        this.metrics.shift();
      }

      // Reset counters for next interval
      this.requestCount = 0;
      this.errorCount = 0;
    } catch (error) {
      this.logger.error('Failed to collect metrics', error.stack);
    }
  }

  /**
   * Get CPU usage percentage (simplified - uses process CPU usage).
   */
  private getCpuUsage(): number {
    const usage = process.cpuUsage();
    // Simplified CPU usage calculation
    // In production, you might want to use a library like 'os' or 'systeminformation'
    return Math.min(100, (usage.user + usage.system) / 10000);
  }

  /**
   * Get memory usage percentage.
   */
  private getMemoryUsage(): number {
    const usage = process.memoryUsage();
    const totalMemory = usage.heapTotal;
    const usedMemory = usage.heapUsed;
    return totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0;
  }

  /**
   * Calculate average response time from recent requests.
   */
  private calculateAverageResponseTime(): number {
    if (this.responseTimes.length === 0) {
      return 0;
    }
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return sum / this.responseTimes.length;
  }

  /**
   * Record a request.
   */
  recordRequest(responseTime?: number) {
    this.requestCount++;
    if (responseTime !== undefined) {
      this.responseTimes.push(responseTime);
      // Keep only last MAX_RESPONSE_TIMES
      if (this.responseTimes.length > this.MAX_RESPONSE_TIMES) {
        this.responseTimes.shift();
      }
    }
  }

  /**
   * Record an error.
   */
  recordError() {
    this.errorCount++;
  }

  /**
   * Get current metrics.
   */
  getCurrentMetrics(): SystemMetric | null {
    if (this.metrics.length === 0) {
      return null;
    }
    return this.metrics[this.metrics.length - 1];
  }

  /**
   * Get metrics history.
   *
   * @param limit - Maximum number of metrics to return
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   */
  getMetricsHistory(
    limit = 100,
    startDate?: Date,
    endDate?: Date,
  ): SystemMetric[] {
    let filtered = [...this.metrics];

    if (startDate) {
      filtered = filtered.filter((m) => m.timestamp >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter((m) => m.timestamp <= endDate);
    }

    return filtered.slice(-limit);
  }

  /**
   * Get metrics summary.
   */
  getMetricsSummary() {
    const recent = this.getMetricsHistory(60); // Last 60 metrics (1 hour if collected every minute)

    if (recent.length === 0) {
      return {
        averageCpuUsage: 0,
        averageMemoryUsage: 0,
        totalRequests: 0,
        totalErrors: 0,
        averageResponseTime: 0,
        errorRate: 0,
      };
    }

    const avgCpu =
      recent.reduce((sum, m) => sum + m.cpuUsage, 0) / recent.length;
    const avgMemory =
      recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length;
    const totalRequests = recent.reduce((sum, m) => sum + m.requestCount, 0);
    const totalErrors = recent.reduce((sum, m) => sum + m.errorCount, 0);
    const avgResponseTime =
      recent.reduce((sum, m) => sum + m.averageResponseTime, 0) / recent.length;
    const errorRate =
      totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    return {
      averageCpuUsage: avgCpu,
      averageMemoryUsage: avgMemory,
      totalRequests,
      totalErrors,
      averageResponseTime: avgResponseTime,
      errorRate,
    };
  }
}
