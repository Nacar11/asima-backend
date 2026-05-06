import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DragonPay V2 Callback DTO
 *
 * Validates GET query params from DragonPay postback/return callbacks.
 * All params are lowercase per the v2.26 spec (section 5.2.3).
 *
 * Example callback URL:
 * GET /postback?txnid=1234&refno=5678&status=S&message=72843747212
 *     &digest=a4b3d08462...&signature=ADSADE123Q2...&signatures=...
 *     &merchantid=TEST&param1=&param2=&amount=100.00&ccy=PHP&procid=GCSH
 *     &settledate=2025-09-29
 */
export class DragonPayV2CallbackDto {
  @IsString()
  txnid: string;

  @IsString()
  refno: string;

  @IsString()
  @IsEnum(['S', 'F', 'P', 'U', 'V'])
  status: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value || '0.00')
  amount: string;

  @IsString()
  @IsOptional()
  ccy?: string;

  @IsString()
  @IsOptional()
  procid?: string;

  @IsString()
  @IsOptional()
  settledate?: string;

  @IsString()
  @IsOptional()
  merchantid?: string;

  @IsString()
  @IsOptional()
  param1?: string;

  @IsString()
  @IsOptional()
  param2?: string;

  /** SHA1 digest (deprecated Dec 10, 2025) */
  @IsString()
  @IsOptional()
  digest?: string;

  /** HMAC-SHA256 signature (sunset March 31, 2026) */
  @IsString()
  @IsOptional()
  signature?: string;

  /** RSA-SHA256 signature (mandatory going forward) */
  @IsString()
  @IsOptional()
  signatures?: string;
}
