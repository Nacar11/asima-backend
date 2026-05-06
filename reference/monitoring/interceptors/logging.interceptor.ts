import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApplicationLoggerService } from '@/loggers/services/application.logger.service';
import { MetricsService } from '@/monitoring/services/metrics.service';

/**
 * Logging interceptor for request/response logging.
 *
 * Logs all HTTP requests and responses with timing information.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: ApplicationLoggerService,
    private readonly metricsService: MetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    const userId = request.user?.id;
    const requestId = headers['x-request-id'] || `req-${Date.now()}`;

    // Log request
    this.logger.log(`${method} ${url}`, {
      userId,
      requestId,
      endpoint: url,
      method,
      ipAddress: ip,
      userAgent,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Record metrics
          this.metricsService.recordRequest(responseTime);

          // Log response
          this.logger.log(
            `${method} ${url} ${statusCode} - ${responseTime}ms`,
            {
              userId,
              requestId,
              endpoint: url,
              method,
              ipAddress: ip,
              statusCode,
              responseTime,
            },
          );

          // Log errors for 5xx status codes
          if (statusCode >= 500) {
            this.metricsService.recordError();
            this.logger.error(`${method} ${url} ${statusCode}`, undefined, {
              userId,
              requestId,
              endpoint: url,
              method,
              ipAddress: ip,
              statusCode,
              responseTime,
            });
          }
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          const statusCode = error.status || 500;

          // Record error metrics
          this.metricsService.recordError();

          // Log error
          this.logger.error(
            `${method} ${url} ${statusCode} - ${responseTime}ms`,
            error.stack,
            {
              userId,
              requestId,
              endpoint: url,
              method,
              ipAddress: ip,
              statusCode,
              responseTime,
              errorMessage: error.message,
            },
          );
        },
      }),
    );
  }
}
