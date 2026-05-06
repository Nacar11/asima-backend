import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class CleanEntityInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.removeEntityMetadata(data)));
  }

  private removeEntityMetadata(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.removeEntityMetadata(item));
    }

    if (obj && typeof obj === 'object' && '__entity' in obj) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { __entity, ...rest } = obj;
      return rest;
    }

    return obj;
  }
}
