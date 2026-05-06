import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { CsrfService } from '../services/csrf.service';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly csrfService: CsrfService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Skip CSRF check for GET requests (token generation endpoint)
    if (request.method === 'GET') {
      return true;
    }

    const csrfToken = request.headers['x-csrf-token'] as string;
    const sessionId = this.extractSessionId(request);

    if (!csrfToken || !sessionId) {
      throw new ForbiddenException('CSRF token is missing');
    }

    const isValid = await this.csrfService.validateToken(sessionId, csrfToken);

    if (!isValid) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }

  private extractSessionId(request: Request): string | null {
    // Extract session ID from cookie or generate from IP + User-Agent
    const sessionCookie = request.cookies?.['csrf_session'];
    if (sessionCookie) {
      return sessionCookie;
    }

    // Fallback: use IP + User-Agent as session identifier
    const ip = request.ip || request.socket.remoteAddress || '';
    const userAgent = request.headers['user-agent'] || '';
    return `${ip}-${userAgent}`;
  }
}
