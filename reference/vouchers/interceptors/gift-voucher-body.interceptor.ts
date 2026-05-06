import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { VoucherDiscountTypeEnum } from '@/vouchers/enums/voucher-discount-type.enum';
import { VoucherScopeEnum } from '@/vouchers/enums/voucher-scope.enum';

/**
 * When POST body contains source_voucher_id, adds placeholder fields so CreateSellerVoucherDto validation passes.
 * The service will overwrite these from the source voucher.
 */
@Injectable()
export class GiftVoucherBodyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const body = request.body as Record<string, unknown>;
    if (body?.source_voucher_id != null) {
      const now = new Date();
      const expires = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      request.body = {
        ...body,
        scope: body.scope ?? VoucherScopeEnum.PRODUCTS,
        discount_type: body.discount_type ?? VoucherDiscountTypeEnum.FIXED,
        discount_value: body.discount_value ?? 0,
        starts_at: body.starts_at ?? now.toISOString(),
        expires_at: body.expires_at ?? expires,
      };
    }
    return next.handle();
  }
}
