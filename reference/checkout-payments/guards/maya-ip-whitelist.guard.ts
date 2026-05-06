import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as net from 'net';

/**
 * Maya IP whitelist guard for webhook endpoints.
 *
 * Blocks requests not originating from Maya's known gateway IPs.
 * Disabled in development/mock mode via MAYA_SKIP_IP_WHITELIST=true.
 *
 * Maya IPs (as of 2025):
 *   Sandbox:    13.229.160.234, 3.1.199.75
 *   Production: 18.138.50.235, 3.1.207.200
 *
 * Override allowed IPs via MAYA_ALLOWED_IPS (comma-separated) without redeployment.
 *
 * SECURITY: X-Forwarded-For is only trusted when the TCP connection itself
 * originates from a known trusted proxy (MAYA_TRUSTED_PROXIES env var).
 * This prevents spoofing the header from outside the proxy chain.
 *
 * @see https://developers.maya.ph/reference/webhooks
 */
@Injectable()
export class MayaIpWhitelistGuard implements CanActivate {
  private readonly logger = new Logger(MayaIpWhitelistGuard.name);

  private static readonly DEFAULT_ALLOWED_IPS: ReadonlySet<string> = new Set([
    // Sandbox
    '13.229.160.234',
    '3.1.199.75',
    // Production
    '18.138.50.235',
    '3.1.207.200',
  ]);

  private readonly skipWhitelist: boolean;
  private readonly allowedIps: ReadonlySet<string>;
  private readonly trustedProxies: ReadonlySet<string>;

  constructor(private readonly configService: ConfigService) {
    const skip = this.configService.get('MAYA_SKIP_IP_WHITELIST', {
      infer: true,
    });
    this.skipWhitelist =
      skip === true ||
      String(skip || '')
        .trim()
        .toLowerCase() === 'true';

    // Allow overriding the IP list via env without redeployment
    const customIps = String(
      this.configService.get('MAYA_ALLOWED_IPS', { infer: true }) || '',
    )
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    this.allowedIps =
      customIps.length > 0
        ? new Set(customIps)
        : MayaIpWhitelistGuard.DEFAULT_ALLOWED_IPS;

    // Trusted proxy IPs — only trust X-Forwarded-For from these socket addresses
    const proxyList = String(
      this.configService.get('MAYA_TRUSTED_PROXIES', { infer: true }) || '',
    )
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    this.trustedProxies = new Set(proxyList);

    if (this.skipWhitelist) {
      this.logger.warn(
        'Maya IP whitelist is DISABLED (MAYA_SKIP_IP_WHITELIST=true)',
      );
    }
  }

  canActivate(context: ExecutionContext): boolean {
    if (this.skipWhitelist) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.extractIp(request);

    if (!ip || !this.allowedIps.has(ip)) {
      this.logger.warn(`Maya webhook blocked from unauthorized IP: ${ip}`);
      throw new ForbiddenException('Unauthorized IP address');
    }

    return true;
  }

  private extractIp(req: Request): string | null {
    const socketIp = this.normalizeIp(
      req.socket?.remoteAddress || req.ip || null,
    );

    // Only trust X-Forwarded-For if the TCP connection itself comes from
    // a known trusted proxy. Without this check, any client can spoof
    // a Maya IP by setting the header themselves.
    if (
      this.trustedProxies.size > 0 &&
      socketIp &&
      this.trustedProxies.has(socketIp)
    ) {
      const forwarded = req.headers['x-forwarded-for'];
      if (forwarded) {
        const first = Array.isArray(forwarded)
          ? forwarded[0]
          : forwarded.split(',')[0];
        const clientIp = this.normalizeIp(first.trim());
        if (clientIp) return clientIp;
      }
    }

    // No trusted proxy configured or request not from a proxy — use raw socket IP
    return socketIp;
  }

  /** Strip IPv6-mapped IPv4 prefix (::ffff:1.2.3.4 → 1.2.3.4) */
  private normalizeIp(raw: string | null): string | null {
    if (!raw) return null;
    const stripped = raw.startsWith('::ffff:') ? raw.slice(7) : raw;
    return net.isIP(stripped) ? stripped : net.isIP(raw) ? raw : null;
  }
}
