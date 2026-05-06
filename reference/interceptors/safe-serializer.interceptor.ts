import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Observable, map } from 'rxjs';

/**
 * Replacement for ClassSerializerInterceptor that catches
 * instanceToPlain crashes and logs the offending request
 * instead of crashing the entire Node.js process.
 */
@Injectable()
export class SafeSerializerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SafeSerializerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req?.method;
    const url = req?.url;

    return next.handle().pipe(
      map((data) => {
        try {
          return instanceToPlain(data);
        } catch (error: any) {
          this.logger.error(
            `instanceToPlain crashed on ${method} ${url}: ${error.message}`,
          );
          this.logger.error(
            `Response data type: ${typeof data}, constructor: ${data?.constructor?.name}`,
          );
          // Return data as-is instead of crashing the process
          return data;
        }
      }),
    );
  }
}
