import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DragonPay V2 Payout Callback DTO
 *
 * Validates GET query params from DragonPay Mass Payout API postback callbacks.
 *
 * Example callback URL:
 * GET /payout-postback?merchantTxnId=TXN-123&refNo=GF43UMTD7AX5&status=S&message=...
 *     &digest=a4b3d08462...
 */
export class DragonPayV2PayoutCallbackDto {
  @IsString()
  merchantTxnId: string;

  @IsString()
  refNo: string;

  @IsString()
  @IsEnum(['S', 'F', 'P', 'Q', 'H', 'G', 'V']) // S=Success, F=Failed, P=Pending, Q=Queued, H=OnHold, G=InProgress, V=Voided
  status: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value || '0.00')
  amount?: string;

  @IsString()
  @IsOptional()
  ccy?: string;

  @IsString()
  @IsOptional()
  procid?: string;

  @IsString()
  @IsOptional()
  procmsg?: string;

  @IsString()
  @IsOptional()
  procdetail?: string;

  @IsString()
  @IsOptional()
  settledate?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value || '0.00')
  fee?: string;

  @IsString()
  @IsOptional()
  merchantid?: string;

  /** SHA1 digest: SHA1("{merchantTxnId}:{refNo}:{status}:{message}:{password}") — uses DRAGONPAY_PASSWORD (collection password) */
  @IsString()
  @IsOptional()
  digest?: string;

  @IsString()
  @IsOptional()
  param1?: string;

  @IsString()
  @IsOptional()
  param2?: string;
}
