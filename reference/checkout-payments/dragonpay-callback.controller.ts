import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  Header,
  HttpStatus,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';
import { CheckoutPaymentsService } from './checkout-payments.service';
import { BaseMembershipPaymentRepository } from '@/memberships/persistence/base-membership-payment.repository';
import {
  DragonPayV2CallbackDto,
  DragonPayV2PayoutCallbackDto,
} from './dto/dragonpay-v2';

/**
 * DragonPay Callback Controller
 *
 * Handles DragonPay V2 postback and return callbacks.
 * This controller is NOT protected by JWT — DragonPay callbacks are
 * unauthenticated server-to-server calls verified via RSA-SHA256 signatures.
 *
 * Callback URLs must be registered in DragonPay Admin Portal:
 * - Postback URL: {APP_URL}/api/v1/checkout-payments/dragonpay/postback
 * - Payout Postback URL: {APP_URL}/api/v1/checkout-payments/dragonpay/payout-postback
 * - Return URL:   {APP_URL}/api/v1/checkout-payments/dragonpay/return
 *
 * DragonPay sends HTTP GET requests with query params to both URLs.
 * Postback must return `text/plain` with `result=OK` on success.
 * Return should redirect the user's browser to a frontend page.
 */
@ApiTags('DragonPay Callbacks')
@Controller({
  path: 'checkout-payments/dragonpay',
  version: '1',
})
export class DragonPayCallbackController {
  private readonly logger = new Logger(DragonPayCallbackController.name);
  private static readonly TXNID_PATTERN = /^PAY-[A-Z0-9-]{8,80}$/;

  constructor(
    private readonly service: CheckoutPaymentsService,
    private readonly configService: ConfigService,
    private readonly membershipPaymentRepository: BaseMembershipPaymentRepository,
  ) {}

  /**
   * DragonPay Postback URL (server-to-server).
   *
   * Invoked by DragonPay directly when payment status changes.
   * Must return `result=OK` as text/plain with HTTP 200 on success.
   * On error: `result=ERROR_CODE` with HTTP 4xx/5xx.
   *
   * Can receive async calls later if status changes (e.g., PENDING → SUCCESS).
   */
  @Get('postback')
  @Header('Content-Type', 'text/plain')
  @ApiExcludeEndpoint()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handlePostbackGet(
    @Query() callback: DragonPayV2CallbackDto,
    @Res() res: Response,
  ): Promise<void> {
    return this.processPostback(callback, res);
  }

  @Post('postback')
  @Header('Content-Type', 'text/plain')
  @ApiExcludeEndpoint()
  async handlePostbackPost(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // DragonPay may send POST with data in body, query, or both.
    // Merge them so we handle all cases.
    const merged = { ...req.query, ...req.body } as DragonPayV2CallbackDto;
    this.logger.debug(
      `POST postback raw — query: ${JSON.stringify(req.query)}, body: ${JSON.stringify(req.body)}, content-type: ${req.headers['content-type']}`,
    );
    return this.processPostback(merged, res);
  }

  private async processPostback(
    callback: DragonPayV2CallbackDto,
    res: import('express').Response,
  ): Promise<void> {
    this.logger.log(
      `DragonPay postback received: txnid=${callback.txnid} status=${callback.status}`,
    );

    try {
      const result = await this.service.handleDragonPayCallback(callback);
      res.status(HttpStatus.OK).send(`result=${result.result}`);
    } catch (error: any) {
      this.logger.error(
        `DragonPay postback error: txnid=${callback.txnid}`,
        error.message,
      );

      if (error.status === 400) {
        res.status(HttpStatus.BAD_REQUEST).send('result=ERROR_CODE');
        return;
      }
      if (error.status === 401) {
        res.status(HttpStatus.UNAUTHORIZED).send('result=ERROR_CODE');
        return;
      }
      if (error.status === 404) {
        res.status(HttpStatus.NOT_FOUND).send('result=ERROR_CODE');
        return;
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('result=ERROR_CODE');
    }
  }

  /**
   * DragonPay Payout Postback URL (server-to-server).
   *
   * Invoked by DragonPay directly when payout status changes.
   * Must return `result=OK` as text/plain with HTTP 200 on success.
   * On error: `result=ERROR_CODE` with HTTP 4xx/5xx.
   *
   * Can receive async calls later if status changes (e.g., PENDING → SUCCESS).
   */
  @Get('payout-postback')
  @Header('Content-Type', 'text/plain')
  @ApiExcludeEndpoint()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handlePayoutPostbackGet(
    @Query() callback: DragonPayV2PayoutCallbackDto,
    @Res() res: Response,
  ): Promise<void> {
    return this.processPayoutPostback(callback, res);
  }

  @Post('payout-postback')
  @Header('Content-Type', 'text/plain')
  @ApiExcludeEndpoint()
  async handlePayoutPostbackPost(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // DragonPay may send POST with data in body, query, or both.
    // Merge them so we handle all cases.
    const merged = {
      ...req.query,
      ...req.body,
    } as DragonPayV2PayoutCallbackDto;
    this.logger.debug(
      `POST payout postback raw — query: ${JSON.stringify(req.query)}, body: ${JSON.stringify(req.body)}, content-type: ${req.headers['content-type']}`,
    );
    return this.processPayoutPostback(merged, res);
  }

  private async processPayoutPostback(
    callback: DragonPayV2PayoutCallbackDto,
    res: import('express').Response,
  ): Promise<void> {
    this.logger.log(
      `DragonPay payout postback received: merchantTxnId=${callback.merchantTxnId} status=${callback.status}`,
    );

    try {
      const result = await this.service.handleDragonPayPayoutCallback(callback);
      res.status(HttpStatus.OK).send(`result=${result.result}`);
    } catch (error: any) {
      this.logger.error(
        `DragonPay payout postback error: merchantTxnId=${callback.merchantTxnId}`,
        error.message,
      );

      if (error.status === 400) {
        res.status(HttpStatus.BAD_REQUEST).send('result=ERROR_CODE');
        return;
      }
      if (error.status === 401) {
        res.status(HttpStatus.UNAUTHORIZED).send('result=ERROR_CODE');
        return;
      }
      if (error.status === 404) {
        res.status(HttpStatus.NOT_FOUND).send('result=ERROR_CODE');
        return;
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('result=ERROR_CODE');
    }
  }

  /**
   * Mock payment page — development only.
   *
   * Opens in-app browser to this URL (returned as checkout_url in mock mode).
   * User picks a status to simulate the DragonPay postback.
   */
  @Get('mock-pay')
  @ApiExcludeEndpoint()
  handleMockPay(@Query('txnid') txnid: string, @Res() res: Response) {
    const env = this.configService.get('DRAGONPAY_MOCK', { infer: true });
    const isMockEnabled =
      typeof env === 'string' && (env.toLowerCase() === 'true' || env === '1');
    if (!isMockEnabled) {
      res.status(HttpStatus.NOT_FOUND).send('Not found');
      return;
    }

    if (!this.isValidTxnId(txnid)) {
      res.status(HttpStatus.BAD_REQUEST).send('Invalid transaction ID');
      return;
    }

    const safeTxnid = this.escapeHtml(txnid);

    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mock DragonPay Payment</title>
<style>
  body{font-family:-apple-system,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;padding:24px;text-align:center}
  h2{margin-bottom:8px}
  p{color:#6b7280;font-size:14px;margin-bottom:24px}
  .txnid{font-family:monospace;font-size:13px;background:#e5e7eb;padding:4px 8px;border-radius:4px;margin-bottom:24px;display:inline-block}
  .btn{display:block;width:100%;max-width:280px;padding:14px;border:none;border-radius:8px;font-size:16px;font-weight:600;color:#fff;cursor:pointer;margin-bottom:12px}
  .success{background:#22c55e}
  .fail{background:#ef4444}
  .cancel{background:#6b7280}
</style>
</head>
<body>
<h2>Mock DragonPay</h2>
<p>Simulate a payment result for:</p>
<div class="txnid">${safeTxnid}</div>
<form method="POST" action="/api/v1/checkout-payments/dragonpay/postback">
  <input type="hidden" name="txnid" value="${safeTxnid}">
  <input type="hidden" name="refno" value="MOCK-REF-${safeTxnid}">
  <input type="hidden" name="message" value="Mock">
  <input type="hidden" name="amount" value="0.00">
  <input type="hidden" name="status" id="statusField" value="S">
  <button type="submit" class="btn success" onclick="document.getElementById('statusField').value='S'">Pay Success (S)</button>
  <button type="submit" class="btn fail" onclick="document.getElementById('statusField').value='F'">Pay Failed (F)</button>
  <button type="submit" class="btn cancel" onclick="document.getElementById('statusField').value='V'">Cancel (V)</button>
</form>
</body></html>`);
  }

  /**
   * DragonPay Return URL (browser redirect).
   *
   * Invoked after postback — redirects the customer's browser
   * to the frontend payment result page.
   *
   * Status codes: S=Success, P=Pending, F=Failure, V=Void/Cancelled
   *
   * Redirects to {FRONTEND_DOMAIN}/payment-result?status=S&txnid=...
   * The frontend page handles the result and navigates accordingly:
   *   S → order confirmation page
   *   F/V → back to checkout preview so the user can retry
   *   P → pending page (polls for final status)
   */
  @Get('return')
  @ApiExcludeEndpoint()
  async handleReturn(
    @Query('txnid') txnid: string,
    @Query('status') status: string,
    @Query('refno') refno: string,
    @Res() res: Response,
  ) {
    const normalizedStatus = this.normalizeStatus(status);
    const normalizedTxnid = this.isValidTxnId(txnid) ? txnid : '';
    this.logger.log(
      `DragonPay return: txnid=${normalizedTxnid} status=${normalizedStatus}`,
    );

    const frontendDomain = this.configService.getOrThrow('FRONTEND_DOMAIN', {
      infer: true,
    });

    // Check if this is a membership payment by looking up the transaction
    // Membership payments use param2 to store membership payment data
    const isMembershipPayment = await this.isMembershipPayment(txnid);

    const params = new URLSearchParams({
      status: normalizedStatus,
      txnid: normalizedTxnid,
    });
    if (refno) params.set('refno', refno);

    // Add renewal parameter for membership payments
    if (isMembershipPayment) {
      params.set('renewal', 'true'); // We'll detect if it's renewal in the frontend
    }

    const redirectUrl = isMembershipPayment
      ? `${frontendDomain}/membership/payment-callback?${params.toString()}`
      : `${frontendDomain}/payment-result?${params.toString()}`;

    res.redirect(302, redirectUrl);
  }

  private isValidTxnId(txnid: string): boolean {
    if (!txnid) {
      return false;
    }

    return DragonPayCallbackController.TXNID_PATTERN.test(txnid);
  }

  private async isMembershipPayment(txnid: string): Promise<boolean> {
    // Look up the payment by transaction number to check if it's a membership payment
    try {
      const payment =
        await this.membershipPaymentRepository.findByProviderReference(txnid);
      return !!payment;
    } catch (error) {
      this.logger.warn(
        `Failed to check membership payment for txnid: ${txnid}`,
        error,
      );
      return false;
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private normalizeStatus(status: string): string {
    const normalized = String(status || '').toUpperCase();
    if (['S', 'F', 'V', 'P', 'U'].includes(normalized)) {
      return normalized;
    }

    return 'U';
  }
}
