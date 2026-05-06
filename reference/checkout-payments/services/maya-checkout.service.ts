import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

type MayaPaymentResultStatus =
  | 'success'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'cancelled'
  | 'pending';

export interface MayaCheckoutSessionInput {
  txnid: string;
  amount: number;
  currency: string;
  description: string;
  email: string;
  customerName?: string;
  contactNumber?: string;
  metadata?: Record<string, any>;
  authorizationType?: 'NORMAL' | 'FINAL' | 'PREAUTHORIZATION';
}

export interface MayaPaymentRetrievalResult {
  paymentId: string;
  status: string;
  requestReferenceNumber: string;
  raw: Record<string, any>;
}

export interface MayaCheckoutSessionResult {
  checkoutId: string;
  referenceNumber: string;
  checkoutUrl: string;
  raw: Record<string, any>;
}

export interface MayaWebhookResult {
  eventId: string;
  eventType: string | null;
  txnid: string;
  status: MayaPaymentResultStatus;
  referenceNumber: string | null;
  failureReason?: string;
  raw: Record<string, any>;
}

export { MayaPaymentResultStatus };

@Injectable()
export class MayaCheckoutService {
  private readonly logger = new Logger(MayaCheckoutService.name);
  private readonly http: AxiosInstance;

  private readonly useMockMaya: boolean;
  private readonly skipSignatureVerification: boolean;
  private readonly appUrl: string;
  private readonly frontendDomain: string;
  private readonly checkoutBaseUrl: string;
  private readonly publicKey: string;
  private readonly secretKey: string;
  private readonly webhookSecret: string;
  private readonly webhookSignatureHeader: string;

  constructor(private readonly configService: ConfigService) {
    this.http = axios.create({ timeout: 30000 });
    this.useMockMaya = this.parseBoolean(
      this.configService.get('USE_MOCK_MAYA', { infer: true }),
      false,
    );
    this.skipSignatureVerification = this.parseBoolean(
      this.configService.get('MAYA_SKIP_SIGNATURE_VERIFICATION', {
        infer: true,
      }),
      false,
    );
    this.appUrl =
      this.configService.get('APP_URL', { infer: true }) ||
      'http://localhost:4080';
    this.frontendDomain =
      this.configService.get('FRONTEND_DOMAIN', { infer: true }) ||
      'http://localhost:3000';
    this.checkoutBaseUrl =
      this.configService.get('MAYA_CHECKOUT_BASE_URL', { infer: true }) ||
      'https://pg-sandbox.paymaya.com';
    this.publicKey =
      this.configService.get('MAYA_PUBLIC_KEY', { infer: true }) || '';
    this.secretKey =
      this.configService.get('MAYA_SECRET_KEY', { infer: true }) || '';
    this.webhookSecret =
      this.configService.get('MAYA_WEBHOOK_SECRET', { infer: true }) || '';
    this.webhookSignatureHeader = String(
      this.configService.get('MAYA_WEBHOOK_SIGNATURE_HEADER', {
        infer: true,
      }) || 'x-signature',
    )
      .trim()
      .toLowerCase();

    const nodeEnv = String(
      this.configService.get('NODE_ENV', { infer: true }) || '',
    ).toLowerCase();
    const isProduction = nodeEnv === 'production';

    if (this.useMockMaya) {
      if (isProduction) {
        throw new Error(
          'USE_MOCK_MAYA=true is not allowed in production. Disable it or set NODE_ENV to a non-production value.',
        );
      }
      this.logger.warn(
        'Maya Checkout running in MOCK mode (USE_MOCK_MAYA=true)',
      );
    }
    if (this.skipSignatureVerification) {
      if (isProduction) {
        throw new Error(
          'MAYA_SKIP_SIGNATURE_VERIFICATION=true is not allowed in production.',
        );
      }
      this.logger.warn('Maya webhook signature verification is DISABLED');
    }
  }

  isMockEnabled(): boolean {
    return this.useMockMaya;
  }

  getWebhookSignatureHeader(): string {
    return this.webhookSignatureHeader;
  }

  async createCheckoutSession(
    input: MayaCheckoutSessionInput,
  ): Promise<MayaCheckoutSessionResult> {
    if (this.useMockMaya) {
      return this.createMockCheckoutSession(input);
    }

    this.validateCheckoutInput(input);

    const apiKey = this.getCheckoutApiKey();
    if (!apiKey) {
      throw new BadRequestException(
        'Maya API key is not configured. Set MAYA_PUBLIC_KEY (preferred) or MAYA_SECRET_KEY, or enable USE_MOCK_MAYA.',
      );
    }

    const url = `${this.checkoutBaseUrl.replace(/\/+$/, '')}/checkout/v1/checkouts`;
    const amountValue = Number(input.amount.toFixed(2));
    const currency = input.currency || 'PHP';
    const redirectBase = `${this.appUrl}/api/v1/checkout-payments/maya/return`;
    const buyerNames = this.resolveBuyerNames(input.customerName);

    // Build contact object — omit fields with no value (Basic Buyer: all optional)
    const contact: Record<string, string> = {};
    if (input.contactNumber) contact.phone = input.contactNumber;
    if (input.email) contact.email = input.email;

    const payload: Record<string, any> = {
      totalAmount: { value: amountValue, currency },
      requestReferenceNumber: input.txnid,
      redirectUrl: {
        success: `${redirectBase}?status=S&txnid=${encodeURIComponent(input.txnid)}`,
        failure: `${redirectBase}?status=F&txnid=${encodeURIComponent(input.txnid)}`,
        cancel: `${redirectBase}?status=V&txnid=${encodeURIComponent(input.txnid)}`,
      },
      items: [
        {
          name: input.description || 'Order payment',
          quantity: 1,
          amount: { value: amountValue, currency },
          totalAmount: { value: amountValue, currency },
        },
      ],
      buyer: {
        firstName: buyerNames.firstName,
        lastName: buyerNames.lastName,
        ...(Object.keys(contact).length > 0 && { contact }),
      },
      metadata: {
        ...(input.metadata || {}),
        txnid: input.txnid,
      },
    };

    if (input.authorizationType) {
      payload.authorizationType = input.authorizationType;
    }

    const authToken = Buffer.from(`${apiKey}:`, 'utf-8').toString('base64');
    const response = await this.http.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authToken}`,
      },
    });

    const body = response.data || {};
    const checkoutUrl =
      body.redirectUrl ||
      body.checkoutUrl ||
      body?.links?.checkout ||
      body?.data?.checkoutUrl ||
      null;
    const checkoutId =
      body.checkoutId || body.id || body.referenceNumber || input.txnid;
    const referenceNumber =
      body.referenceNumber || body.requestReferenceNumber || input.txnid;

    if (!checkoutUrl) {
      throw new BadRequestException(
        'Maya checkout URL was not returned by the gateway',
      );
    }

    return {
      checkoutId: String(checkoutId),
      referenceNumber: String(referenceNumber),
      checkoutUrl: String(checkoutUrl),
      raw: body as Record<string, any>,
    };
  }

  async createRefund(
    paymentId: string,
    amount: number,
    reason: string,
  ): Promise<{ refundId: string; status: string; raw: Record<string, any> }> {
    if (!this.secretKey) {
      throw new BadRequestException(
        'MAYA_SECRET_KEY is required for refunds. Set it in your environment config.',
      );
    }

    const baseUrl = this.checkoutBaseUrl.replace(/\/+$/, '');
    const url = `${baseUrl}/payments/v1/payments/${encodeURIComponent(paymentId)}/refunds`;
    const authToken = Buffer.from(`${this.secretKey}:`, 'utf-8').toString(
      'base64',
    );

    const payload = {
      totalAmount: {
        value: Number(amount.toFixed(2)),
        currency: 'PHP',
      },
      reason,
    };

    this.logger.log(`Initiating Maya refund`, { paymentId, amount, reason });

    const response = await this.http.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authToken}`,
      },
    });

    const body = response.data || {};
    const refundId = body.id || body.refundId || body.referenceNumber;
    const status = String(body.status || '').toUpperCase();

    if (!refundId) {
      throw new BadRequestException(
        'Maya refund response did not include a refund ID',
      );
    }

    this.logger.log(`Maya refund created`, { paymentId, refundId, status });

    return {
      refundId: String(refundId),
      status,
      raw: body as Record<string, any>,
    };
  }

  processWebhook(
    payload: Record<string, any>,
    signature?: string,
  ): MayaWebhookResult {
    if (!this.useMockMaya) {
      this.verifyWebhookSignature(payload, signature);
    }

    return this.parseWebhookPayload(payload);
  }

  parseWebhookPayload(payload: Record<string, any>): MayaWebhookResult {
    const raw = payload || {};
    const eventId = this.extractWebhookEventId(raw);
    const eventType = String(
      raw.eventType || raw.type || raw.event || '',
    ).toLowerCase();
    const statusField = String(
      raw.status ||
        raw.paymentStatus ||
        raw.state ||
        raw.result?.status ||
        raw.data?.attributes?.status ||
        raw.data?.attributes?.paymentStatus ||
        '',
    ).toLowerCase();

    const txnid =
      raw.requestReferenceNumber ||
      raw.referenceNumber ||
      raw.txnid ||
      raw?.data?.attributes?.requestReferenceNumber ||
      raw?.data?.attributes?.metadata?.txnid ||
      raw?.metadata?.txnid;

    if (!txnid || typeof txnid !== 'string') {
      throw new BadRequestException(
        'Maya webhook payload is missing requestReferenceNumber/txnid',
      );
    }

    const referenceNumber =
      raw.checkoutId ||
      raw.id ||
      raw.referenceNumber ||
      raw?.data?.id ||
      raw?.data?.attributes?.checkoutId ||
      null;

    let status: MayaPaymentResultStatus = 'pending';
    if (
      eventType.includes('success') ||
      statusField.includes('success') ||
      statusField === 'paid'
    ) {
      status = 'success';
    } else if (
      statusField === 'authorized' ||
      eventType.includes('authorized')
    ) {
      status = 'authorized';
    } else if (statusField === 'captured' || eventType.includes('captured')) {
      status = 'captured';
    } else if (
      eventType.includes('fail') ||
      eventType.includes('expired') ||
      statusField.includes('fail') ||
      statusField === 'expired' ||
      statusField === 'error' ||
      statusField === 'capture_hold_expired'
    ) {
      status = 'failed';
    } else if (
      eventType.includes('cancel') ||
      eventType.includes('dropout') ||
      statusField.includes('cancel') ||
      statusField === 'voided' ||
      statusField === 'void'
    ) {
      status = 'cancelled';
    }

    if (status === 'pending' && eventType && !eventType.includes('pending')) {
      this.logger.warn(
        `Unrecognised Maya eventType/status — defaulted to pending. ` +
          `eventType="${eventType}" statusField="${statusField}" txnid="${txnid}"`,
      );
    }

    return {
      eventId,
      eventType: eventType || null,
      txnid,
      status,
      referenceNumber: referenceNumber ? String(referenceNumber) : null,
      failureReason:
        raw?.error?.message ||
        raw?.message ||
        raw?.result?.message ||
        undefined,
      raw,
    };
  }

  /**
   * Capture an authorized payment.
   * Uses secret key. Only valid when payment status is AUTHORIZED.
   * POST /payments/v1/payments/{paymentId}/capture
   */
  async capturePayment(
    paymentId: string,
    amount?: number,
  ): Promise<Record<string, any>> {
    if (!this.secretKey) {
      throw new BadRequestException(
        'MAYA_SECRET_KEY is required for capturePayment',
      );
    }
    const url = `${this.checkoutBaseUrl.replace(/\/+$/, '')}/payments/v1/payments/${paymentId}/capture`;
    const authToken = Buffer.from(`${this.secretKey}:`, 'utf-8').toString(
      'base64',
    );
    const body: Record<string, any> = {};
    if (amount !== undefined) {
      body.totalAmount = { value: Number(amount.toFixed(2)), currency: 'PHP' };
    }
    const response = await this.http.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authToken}`,
      },
    });
    return response.data || {};
  }

  /**
   * Cancel/void a payment before it is authenticated or captured.
   * Uses secret key.
   * POST /payments/v1/payments/{paymentId}/cancel
   */
  async cancelPayment(paymentId: string): Promise<Record<string, any>> {
    if (!this.secretKey) {
      throw new BadRequestException(
        'MAYA_SECRET_KEY is required for cancelPayment',
      );
    }
    const url = `${this.checkoutBaseUrl.replace(/\/+$/, '')}/payments/v1/payments/${paymentId}/cancel`;
    const authToken = Buffer.from(`${this.secretKey}:`, 'utf-8').toString(
      'base64',
    );
    const response = await this.http.post(
      url,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authToken}`,
        },
      },
    );
    return response.data || {};
  }

  /**
   * Retrieve payment details by paymentId.
   * Uses secret key. Fallback when webhooks fail.
   * GET /payments/v1/payments/{paymentId}
   */
  async retrievePayment(
    paymentId: string,
  ): Promise<MayaPaymentRetrievalResult> {
    const url = `${this.checkoutBaseUrl.replace(/\/+$/, '')}/payments/v1/payments/${paymentId}`;
    const authToken = Buffer.from(`${this.secretKey}:`, 'utf-8').toString(
      'base64',
    );
    const response = await this.http.get(url, {
      headers: { Authorization: `Basic ${authToken}` },
    });
    const body = response.data || {};
    return {
      paymentId: String(body.id || body.checkoutId || paymentId),
      status: String(body.status || body.paymentStatus || '').toLowerCase(),
      requestReferenceNumber: String(
        body.requestReferenceNumber || body.referenceNumber || '',
      ),
      raw: body,
    };
  }

  buildFrontendRedirectUrl(params: {
    status: string;
    txnid: string;
    refno?: string;
  }): string {
    // Validate frontendDomain is an absolute http/https URL to prevent open redirect
    let base: URL;
    try {
      base = new URL(this.frontendDomain);
      if (base.protocol !== 'http:' && base.protocol !== 'https:') {
        throw new Error('invalid protocol');
      }
    } catch {
      throw new Error(
        `FRONTEND_DOMAIN is not a valid http/https URL: "${this.frontendDomain}"`,
      );
    }

    const searchParams = new URLSearchParams({
      status: params.status,
      txnid: params.txnid,
    });
    if (params.refno) {
      searchParams.set('refno', params.refno);
    }
    // Use origin to strip any path/credentials from FRONTEND_DOMAIN
    return `${base.origin}/payment-result?${searchParams.toString()}`;
  }

  private verifyWebhookSignature(
    payload: Record<string, any>,
    signature?: string,
  ): void {
    if (this.skipSignatureVerification) {
      return;
    }

    if (!this.webhookSecret) {
      throw new BadRequestException(
        'MAYA_WEBHOOK_SECRET is required when USE_MOCK_MAYA=false',
      );
    }

    if (!signature) {
      throw new BadRequestException('Missing Maya webhook signature');
    }

    const serialized = JSON.stringify(payload || {});
    const digestHex = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(serialized, 'utf8')
      .digest('hex');
    const digestBase64 = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(serialized, 'utf8')
      .digest('base64');

    const normalized = signature.trim();
    const provided = normalized.startsWith('sha256=')
      ? normalized.slice('sha256='.length)
      : normalized;

    const isHexMatch = this.safeCompareDigests(provided, digestHex);
    const isBase64Match = this.safeCompareDigests(provided, digestBase64);
    if (!isHexMatch && !isBase64Match) {
      throw new BadRequestException('Invalid Maya webhook signature');
    }
  }

  private safeCompareDigests(provided: string, expected: string): boolean {
    try {
      const providedBuffer = Buffer.from(provided, 'utf8');
      const expectedBuffer = Buffer.from(expected, 'utf8');
      if (providedBuffer.length !== expectedBuffer.length) {
        return false;
      }
      return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }

  private getCheckoutApiKey(): string {
    if (this.publicKey) {
      return this.publicKey;
    }
    if (this.secretKey) {
      this.logger.warn(
        'MAYA_PUBLIC_KEY is not set. Falling back to MAYA_SECRET_KEY for Create Checkout.',
      );
      return this.secretKey;
    }
    return '';
  }

  private resolveBuyerNames(customerName?: string): {
    firstName: string;
    lastName: string;
  } {
    const normalized = String(customerName || '').trim();
    if (!normalized) {
      return { firstName: 'Customer', lastName: 'User' };
    }
    const parts = normalized.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: 'User' };
    }
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }

  private validateCheckoutInput(input: MayaCheckoutSessionInput): void {
    if (!input?.txnid || !String(input.txnid).trim()) {
      throw new BadRequestException('txnid is required');
    }
    if (
      typeof input.amount !== 'number' ||
      !Number.isFinite(input.amount) ||
      input.amount <= 0
    ) {
      throw new BadRequestException('amount must be greater than 0');
    }
    const email = String(input.email || '').trim();
    if (!email) {
      throw new BadRequestException('email is required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('email format is invalid');
    }
  }

  private extractWebhookEventId(payload: Record<string, any>): string {
    const directEventId =
      payload.eventId ||
      payload.id ||
      payload.event_id ||
      payload?.data?.id ||
      payload?.data?.attributes?.id;

    if (directEventId !== null && directEventId !== undefined) {
      return String(directEventId);
    }

    const base = JSON.stringify(payload || {});
    return crypto.createHash('sha256').update(base, 'utf8').digest('hex');
  }

  private createMockCheckoutSession(
    input: MayaCheckoutSessionInput,
  ): MayaCheckoutSessionResult {
    const checkoutId = `maya-mock-${Date.now()}`;
    const referenceNumber = `MAYA-MOCK-${input.txnid}`;
    const query = new URLSearchParams({
      txnid: input.txnid,
      amount: Number(input.amount.toFixed(2)).toString(),
      currency: input.currency || 'PHP',
    });
    if (input.description) {
      query.set('description', input.description);
    }
    if (input.email) {
      query.set('email', input.email);
    }
    if (input.contactNumber) {
      query.set('contact', input.contactNumber);
    }

    const checkoutUrl = `${this.appUrl}/api/v1/checkout-payments/maya/mock-pay?${query.toString()}`;

    return {
      checkoutId,
      referenceNumber,
      checkoutUrl,
      raw: {
        mock: true,
        checkoutId,
        referenceNumber,
        checkoutUrl,
      },
    };
  }

  private parseBoolean(value: unknown, defaultValue: boolean): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1') {
        return true;
      }
      if (normalized === 'false' || normalized === '0') {
        return false;
      }
    }
    return defaultValue;
  }
}
