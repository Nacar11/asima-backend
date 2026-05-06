import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CheckoutPaymentsService } from './checkout-payments.service';
import { MayaCheckoutService } from './services/maya-checkout.service';
import { MayaIpWhitelistGuard } from './guards/maya-ip-whitelist.guard';

@ApiTags('Maya Callbacks')
@Controller({
  path: 'checkout-payments/maya',
  version: '1',
})
export class MayaCallbackController {
  constructor(
    private readonly checkoutPaymentsService: CheckoutPaymentsService,
    private readonly mayaCheckoutService: MayaCheckoutService,
  ) {}

  @Post('webhook')
  @UseGuards(MayaIpWhitelistGuard)
  @ApiExcludeEndpoint()
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'application/json')
  async handleWebhook(
    @Req() req: Request,
    @Body() payload: Record<string, any>,
  ): Promise<{ result: string }> {
    const configuredHeader =
      this.mayaCheckoutService.getWebhookSignatureHeader();
    const effectiveSignature =
      this.getHeader(req, configuredHeader) ||
      this.getHeader(req, 'x-signature') ||
      this.getHeader(req, 'x-maya-signature');

    return this.checkoutPaymentsService.handleMayaWebhookAsync(
      payload,
      effectiveSignature,
    );
  }

  @Get('return')
  @ApiExcludeEndpoint()
  handleReturn(
    @Query('txnid') txnid: string,
    @Query('status') status: string,
    @Query('refno') refno: string,
    @Res() res: Response,
  ) {
    const normalizedStatus = this.normalizeStatus(status);
    const safeTxnid = txnid || '';
    const redirectUrl = this.mayaCheckoutService.buildFrontendRedirectUrl({
      status: normalizedStatus,
      txnid: safeTxnid,
      refno: refno || undefined,
    });
    res.redirect(302, redirectUrl);
  }

  @Get('mock-pay')
  @ApiExcludeEndpoint()
  handleMockPay(
    @Query('txnid') txnid: string,
    @Query('amount') amount: string,
    @Query('currency') currency: string,
    @Query('description') description: string,
    @Query('email') email: string,
    @Res() res: Response,
  ) {
    if (!this.mayaCheckoutService.isMockEnabled()) {
      res.status(HttpStatus.NOT_FOUND).send('Not found');
      return;
    }

    if (!txnid) {
      throw new BadRequestException('txnid query parameter is required');
    }

    const rawTxnid = String(txnid);
    const safeTxnid = this.escapeHtml(rawTxnid);
    const amountNumber = Number(amount);
    const displayAmount =
      Number.isFinite(amountNumber) && amountNumber > 0
        ? amountNumber.toFixed(2)
        : '0.00';
    const safeCurrency = this.escapeHtml((currency || 'PHP').toUpperCase());
    const safeDescription = this.escapeHtml(
      description || 'Booking payment checkout (mock)',
    );
    const safeEmail = this.escapeHtml(email || 'guest@example.com');

    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Maya Checkout Sandbox (Mock)</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:"Avenir Next",Avenir,Helvetica,Arial,sans-serif;background:linear-gradient(135deg,#f4f7fb 0%,#eef2f8 100%);color:#1f2937;min-height:100vh}
  .layout{display:flex;min-height:100vh;flex-wrap:wrap}
  .left,.right{padding:32px}
  .left{flex:1 1 620px;display:flex;justify-content:center;align-items:center}
  .right{flex:1 1 420px;background:#ffffff;border-left:1px solid #e5e7eb}
  .pay-card{width:100%;max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;padding:28px;box-shadow:0 20px 45px rgba(17,24,39,0.06)}
  .brand{font-size:29px;font-weight:800;letter-spacing:-0.03em}
  .brand-sub{display:inline-block;margin-top:6px;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;background:#ecfdf3;color:#0f9f4a}
  .amount{margin:22px 0 8px;font-size:46px;line-height:1.05;font-weight:300;color:#0f9f4a}
  .amount small{font-size:20px;margin-right:6px;color:#4b5563}
  .meta{background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-top:18px}
  .meta-row{display:flex;gap:10px;justify-content:space-between;font-size:14px;padding:8px 0;border-bottom:1px solid #edf0f5}
  .meta-row:last-child{border-bottom:none}
  .meta-label{color:#6b7280}
  .meta-value{font-weight:700;text-align:right;word-break:break-word}
  .actions{display:flex;gap:12px;margin-top:22px;flex-wrap:wrap}
  .btn{flex:1;min-width:160px;padding:14px 18px;border:none;border-radius:12px;font-size:18px;font-weight:800;cursor:pointer;text-decoration:none;text-align:center}
  .success{background:#1fb86a;color:#fff}
  .fail{background:#e05642;color:#fff}
  .cancel{background:#d1d5db;color:#111827}
  .caption{margin-top:16px;font-size:12px;color:#6b7280}
  .summary{max-width:420px;margin:0 auto}
  .summary h3{font-size:34px;line-height:1.1;margin:8px 0 18px;letter-spacing:-0.03em}
  .row{display:flex;justify-content:space-between;gap:12px;padding:14px 0;border-bottom:1px solid #eceff4}
  .row:last-child{border-bottom:none}
  .label{color:#6b7280}
  .value{font-weight:700;text-align:right}
  .total{font-size:38px;line-height:1;font-weight:900;letter-spacing:-0.02em;margin:26px 0}
  .pill{display:inline-block;padding:4px 10px;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:800}
  @media (max-width:980px){
    .right{border-left:none;border-top:1px solid #e5e7eb}
    .amount{font-size:38px}
    .summary h3{font-size:28px}
    .total{font-size:31px}
  }
</style>
</head>
<body>
<div class="layout">
  <section class="left">
    <div class="pay-card">
      <div class="brand">Maya Checkout</div>
      <div class="brand-sub">SANDBOX MOCK MODE</div>
      <div class="amount"><small>${safeCurrency}</small>${displayAmount}</div>
      <div class="pill">NO REAL CHARGE</div>
      <div class="meta">
        <div class="meta-row"><span class="meta-label">Reference</span><span class="meta-value">${safeTxnid}</span></div>
        <div class="meta-row"><span class="meta-label">Description</span><span class="meta-value">${safeDescription}</span></div>
        <div class="meta-row"><span class="meta-label">Email</span><span class="meta-value">${safeEmail}</span></div>
      </div>
      <div class="actions">
        <a class="btn success" href="/api/v1/checkout-payments/maya/mock-callback?txnid=${encodeURIComponent(rawTxnid)}&status=success">Pay Now</a>
        <a class="btn fail" href="/api/v1/checkout-payments/maya/mock-callback?txnid=${encodeURIComponent(rawTxnid)}&status=failed">Fail Payment</a>
        <a class="btn cancel" href="/api/v1/checkout-payments/maya/mock-callback?txnid=${encodeURIComponent(rawTxnid)}&status=cancelled">Cancel</a>
      </div>
      <div class="caption">This page simulates Maya hosted checkout while <code>USE_MOCK_MAYA=true</code>.</div>
    </div>
  </section>
  <aside class="right">
    <div class="summary">
      <h3>Order Summary</h3>
      <div class="row"><span class="label">Gateway</span><span class="value">Maya (Mock)</span></div>
      <div class="row"><span class="label">Payment Method</span><span class="value">Wallet / Card</span></div>
      <div class="row"><span class="label">Transaction ID</span><span class="value">${safeTxnid}</span></div>
      <div class="row"><span class="label">Amount</span><span class="value">${safeCurrency} ${displayAmount}</span></div>
      <div class="total">${safeCurrency} ${displayAmount}</div>
      <div class="row"><span class="label">Status options</span><span class="value">Success / Failed / Cancelled</span></div>
    </div>
  </aside>
</div>
</body></html>`);
  }

  @Get('mock-callback')
  @ApiExcludeEndpoint()
  async handleMockCallback(
    @Query('txnid') txnid: string,
    @Query('status') status: string,
    @Res() res: Response,
  ) {
    if (!this.mayaCheckoutService.isMockEnabled()) {
      res.status(HttpStatus.NOT_FOUND).send('Not found');
      return;
    }

    const normalized = this.normalizeMockStatus(status);
    const result = await this.checkoutPaymentsService.handleMayaMockCallback({
      txnid,
      status: normalized,
    });

    const frontendStatus =
      normalized === 'success'
        ? 'S'
        : normalized === 'failed'
          ? 'F'
          : normalized === 'cancelled'
            ? 'V'
            : 'P';

    const redirectUrl = this.mayaCheckoutService.buildFrontendRedirectUrl({
      status: frontendStatus,
      txnid,
      refno: result.referenceNumber || undefined,
    });
    res.redirect(302, redirectUrl);
  }

  private normalizeMockStatus(
    status: string,
  ): 'success' | 'failed' | 'cancelled' | 'pending' {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'success') return 'success';
    if (normalized === 'failed') return 'failed';
    if (normalized === 'cancelled') return 'cancelled';
    return 'pending';
  }

  private normalizeStatus(status: string): string {
    const normalized = String(status || '').toUpperCase();
    if (['S', 'F', 'V', 'P', 'U'].includes(normalized)) {
      return normalized;
    }
    return 'U';
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private getHeader(req: Request, key: string): string | undefined {
    const raw = req.headers[key.toLowerCase()];
    if (Array.isArray(raw)) {
      return raw[0];
    }
    if (typeof raw === 'string') {
      return raw;
    }
    return undefined;
  }
}
