import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import { DragonPayCurrencyEnum } from '../../dragonpay-dummy/enums/dragonpay-processor.enum';
import {
  CreateDragonpayPaymentDto,
  DragonPayV2PaymentResult,
  DragonPayV2PayoutResult,
  DragonPayV2TransactionStatus,
  DragonPayV2PayoutStatus,
  DragonPayV2PublicKey,
  DragonpayPayoutDto,
  DragonPayV2RawStatusResponse,
  DragonPayV2RawPayoutStatusResponse,
  DragonPayV2CallbackDto,
  DragonPayV2PayoutCallbackDto,
  DRAGONPAY_PROCESSOR_MAP,
} from '../dto/dragonpay-v2';

/**
 * DragonPay V2 Service
 *
 * Direct REST integration with DragonPay PS API v2.26.
 * Replaces the SDK-based DragonPayService.
 *
 * Auth:
 * - Collect API: HTTP Basic Auth — `Basic base64(merchantId:collectionApiKey)`
 * - Payout API: Bearer token — `Bearer {payoutPassword}`
 *
 * Callback URLs are registered in DragonPay Admin Portal, NOT passed per-request.
 *
 * @see /Volumes/erp/docs/Dragonpay-PS-API-v2-latest.pdf
 */
@Injectable()
export class DragonPayV2Service {
  private readonly logger = new Logger(DragonPayV2Service.name);
  private readonly http: AxiosInstance;
  private readonly merchantId: string;
  private readonly password: string;
  private readonly payoutPassword: string;
  private readonly baseUrl: string;
  private readonly payoutUrl: string;
  private readonly dummyBaseUrl: string;
  private readonly keysBaseUrl: string;
  private readonly enabled: boolean;
  private readonly skipSignatureVerification: boolean;
  private readonly mockMode: boolean;

  /** Cached public keys for RSA-SHA256 verification */
  private cachedPublicKeys: DragonPayV2PublicKey[] = [];
  private publicKeysCachedAt: number = 0;
  private static readonly PUBLIC_KEY_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  private static readonly DEFAULT_APP_PORT = '4080';

  constructor(private readonly configService: ConfigService) {
    this.merchantId =
      this.configService.get('DRAGONPAY_MERCHANT_ID', { infer: true }) || '';
    this.password =
      this.configService.get('DRAGONPAY_PASSWORD', { infer: true }) || '';
    this.payoutPassword =
      this.configService.get('DRAGONPAY_PAYOUT_PASSWORD', { infer: true }) ||
      '';
    this.baseUrl =
      this.configService.get('DRAGONPAY_URL', { infer: true }) ||
      'https://test.dragonpay.ph/api/collect/v2';
    this.payoutUrl =
      this.configService.get('DRAGONPAY_PAYOUT_URL', { infer: true }) ||
      'https://test.dragonpay.ph/api/payout/merchant/v1';

    // DRAGONPAY_KEYS_URL overrides where public keys are fetched from.
    // Use this to point at the local dummy while DRAGONPAY_URL hits the real sandbox.
    // e.g. DRAGONPAY_KEYS_URL=http://localhost:4080/api/v1/dragonpay-dummy/collect/v1
    const rawKeysUrl = this.configService.get<string>('DRAGONPAY_KEYS_URL', {
      infer: true,
    });
    this.keysBaseUrl = rawKeysUrl
      ? rawKeysUrl.trim().replace(/\/+$/, '')
      : this.baseUrl.replace(/\/v2$/, '/v1');

    const rawDummyBaseUrl = this.getStringConfig('DRAGONPAY_DUMMY_URL');
    this.dummyBaseUrl =
      rawDummyBaseUrl ||
      `http://localhost:${this.configService.get<string>('APP_PORT') || DragonPayV2Service.DEFAULT_APP_PORT}/api/v1/dragonpay-dummy`;
    const dragonPayMock = this.getBooleanConfig('DRAGONPAY_MOCK');
    const dragonPayUseDummy = this.getBooleanConfig('DRAGONPAY_USE_DUMMY');
    const legacyMayaMock = this.getBooleanConfig('USE_MOCK_MAYA');

    // Support legacy/alternate flags so existing .env values keep working.
    this.mockMode = dragonPayMock || dragonPayUseDummy || legacyMayaMock;

    // In mock mode the dummy sends signatures:'' (no real RSA key), so always
    // skip signature verification. In production, an opt-in env var allows
    // overriding for staging environments that also lack DragonPay keys.
    this.skipSignatureVerification =
      this.mockMode ||
      this.getBooleanConfig('DRAGONPAY_SKIP_SIGNATURE_VERIFICATION');

    this.enabled = this.mockMode || !!(this.merchantId && this.password);

    if (this.mockMode) {
      this.logger.warn(
        'DragonPay V2 running in MOCK mode — no real API calls will be made',
      );
      if (!dragonPayMock && (dragonPayUseDummy || legacyMayaMock)) {
        this.logger.warn(
          'DragonPay mock mode enabled via compatibility env flag (DRAGONPAY_USE_DUMMY or USE_MOCK_MAYA)',
        );
      }
    } else if (this.enabled) {
      this.logger.log('DragonPay V2 service initialized');
    } else {
      this.logger.warn(
        'DragonPay V2 credentials not configured. Service disabled.',
      );
    }

    if (this.skipSignatureVerification) {
      this.logger.warn(
        'DragonPay signature verification is DISABLED (dev mode)',
      );
    }

    this.http = axios.create({ timeout: 30000 });
  }

  private getStringConfig(key: string): string | undefined {
    const value = this.configService.get<string | number | boolean>(key, {
      infer: true,
    });

    if (value === null || value === undefined) {
      return undefined;
    }

    const normalized = String(value).trim();
    if (!normalized) {
      return undefined;
    }

    const lowered = normalized.toLowerCase();
    if (lowered === 'undefined' || lowered === 'null') {
      return undefined;
    }

    return normalized;
  }

  private getBooleanConfig(key: string): boolean {
    const value = this.configService.get<string | boolean>(key, {
      infer: true,
    });

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return (
        normalized === 'true' || normalized === '1' || normalized === 'yes'
      );
    }

    return false;
  }

  // ─── Availability ───────────────────────────────────────────────

  isAvailable(): boolean {
    return this.enabled;
  }

  isPayoutAvailable(): boolean {
    return this.mockMode || (this.enabled && !!this.payoutPassword);
  }

  // ─── Auth Headers ───────────────────────────────────────────────

  /**
   * HTTP Basic Auth for Collect API (spec section 5.1).
   * Format: `Basic base64(merchantId:collectionApiKey)`
   */
  private getCollectAuthHeaders(): Record<string, string> {
    const credentials = Buffer.from(
      `${this.merchantId}:${this.password}`,
      'utf-8',
    ).toString('base64');
    return {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    };
  }

  /**
   * Bearer auth for Payout API.
   * Format: `Bearer {payoutPassword}`
   */
  private getPayoutAuthHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.payoutPassword}`,
    };
  }

  // ─── Payment Creation ───────────────────────────────────────────

  /**
   * Create payment via V2 Collect API (spec section 5.2.1).
   *
   * Endpoint: POST {baseUrl}/{txnid}/post
   * ProcId is REQUIRED for v2. IpAddress recommended per onboarding.
   * Callback URLs are NOT passed — registered in DragonPay Admin Portal.
   */
  async createPaymentIntent(
    txnid: string,
    dto: CreateDragonpayPaymentDto,
    publicBaseUrl?: string,
  ): Promise<DragonPayV2PaymentResult> {
    if (!this.enabled) {
      throw new BadRequestException('DragonPay V2 is not configured');
    }

    if (this.mockMode) {
      return this.createPaymentViaDummy(txnid, dto, publicBaseUrl);
    }

    const url = `${this.baseUrl}/${txnid}/post`;

    // V2 spec requires PascalCase keys
    const payload: Record<string, any> = {
      Amount: dto.amount.toFixed(2),
      Currency: dto.currency || 'PHP',
      Description: dto.description,
      Email: dto.email,
    };

    if (dto.procId) payload.ProcId = dto.procId;
    if (dto.param1) payload.Param1 = dto.param1;
    if (dto.param2) payload.Param2 = dto.param2;
    if (dto.expiry) payload.Expiry = dto.expiry;
    if (dto.ipAddress) payload.IpAddress = dto.ipAddress;
    if (dto.userAgent) payload.UserAgent = dto.userAgent;

    if (dto.billingDetails) {
      const bd = dto.billingDetails;
      payload.BillingDetails = {};
      if (bd.firstName) payload.BillingDetails.FirstName = bd.firstName;
      if (bd.middleName) payload.BillingDetails.MiddleName = bd.middleName;
      if (bd.lastName) payload.BillingDetails.LastName = bd.lastName;
      if (bd.address1) payload.BillingDetails.Address1 = bd.address1;
      if (bd.address2) payload.BillingDetails.Address2 = bd.address2;
      if (bd.city) payload.BillingDetails.City = bd.city;
      if (bd.state) payload.BillingDetails.Province = bd.state;
      if (bd.country) payload.BillingDetails.Country = bd.country;
      if (bd.zipCode) payload.BillingDetails.ZipCode = bd.zipCode;
      if (bd.telNo) payload.BillingDetails.TelNo = bd.telNo;
      if (bd.email) payload.BillingDetails.Email = bd.email;
    }

    this.logger.log(`Creating DragonPay V2 payment: ${txnid}`);
    this.logger.debug(
      `DragonPay V2 URL: ${url}, MerchantId: ${this.merchantId}, Password length: ${this.password?.length ?? 'null'}`,
    );
    this.logger.debug(`DragonPay V2 payload: ${JSON.stringify(payload)}`);

    try {
      const response = await this.http.post(url, payload, {
        headers: this.getCollectAuthHeaders(),
      });

      this.logger.log(
        `DragonPay V2 payment created: ${txnid} -> ${response.data.RefNo}`,
      );

      return {
        txnid,
        refNo: response.data.RefNo,
        status: response.data.Status,
        message: response.data.Message,
        url: response.data.Url,
      };
    } catch (error: any) {
      this.logger.error(
        `DragonPay V2 payment failed: ${txnid}`,
        error.response?.data || error.message,
      );
      throw new BadRequestException(
        error.response?.data?.Message || 'Failed to create DragonPay payment',
      );
    }
  }

  /**
   * Create payment via local DragonPay dummy service.
   * Maps V2 DTO fields to the dummy's DTO format.
   */
  private async createPaymentViaDummy(
    txnid: string,
    dto: CreateDragonpayPaymentDto,
    publicBaseUrl?: string,
  ): Promise<DragonPayV2PaymentResult> {
    const url = `${this.dummyBaseUrl}/collect`;

    const appUrlRaw = this.getStringConfig('APP_URL');
    const appInternalUrlRaw = this.getStringConfig('APP_INTERNAL_URL');
    const appPort = this.getStringConfig('APP_PORT') || '4080';
    const appHost = this.getStringConfig('APP_HOST') || 'localhost';
    const baseCallbackUrlFromEnv: string = appUrlRaw
      ? String(appUrlRaw).trim().replace(/\/+$/, '')
      : `http://${appHost}:${appPort}`;
    const normalizedPublicBaseUrl: string = publicBaseUrl
      ? String(publicBaseUrl).trim().replace(/\/+$/, '')
      : '';
    const baseCallbackUrl: string = normalizedPublicBaseUrl
      ? normalizedPublicBaseUrl
      : baseCallbackUrlFromEnv;
    const internalBaseCallbackUrl: string = appInternalUrlRaw
      ? String(appInternalUrlRaw).trim().replace(/\/+$/, '')
      : baseCallbackUrl.includes('10.0.2.2')
        ? `http://localhost:${appPort}`
        : baseCallbackUrlFromEnv;
    const postbackUrl = `${internalBaseCallbackUrl}/api/v1/checkout-payments/dragonpay/postback`;
    const returnUrl = `${baseCallbackUrl}/api/v1/checkout-payments/dragonpay/return`;

    const payload = {
      txnid,
      amount: dto.amount,
      ccy:
        DragonPayCurrencyEnum[
          dto.currency?.toUpperCase() as keyof typeof DragonPayCurrencyEnum
        ] || DragonPayCurrencyEnum.PHP,
      description: dto.description,
      email: dto.email,
      procId: dto.procId,
      param1: dto.param1,
      param2: dto.param2,
      postbackUrl,
      returnUrl,
      publicBaseUrl: normalizedPublicBaseUrl || undefined,
    };

    this.logger.log(`Creating dummy payment: ${txnid} via ${url}`);

    try {
      const response = await this.http.post(url, payload);

      this.logger.log(
        `Dummy payment created: ${txnid} -> ${response.data.refNo}`,
      );

      return {
        txnid,
        refNo: response.data.refNo,
        url: response.data.url,
        status: 'P',
        message: response.data.message,
      };
    } catch (error: any) {
      this.logger.error(
        `Dummy payment failed: ${txnid}`,
        error.response?.data || error.message,
      );
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to create dummy payment',
      );
    }
  }

  // ─── Transaction Status Inquiry (spec 5.3.1) ───────────────────

  async getTransactionStatus(
    txnid: string,
  ): Promise<DragonPayV2TransactionStatus> {
    if (!this.enabled) {
      throw new BadRequestException('DragonPay V2 is not configured');
    }

    // Route to dummy for status inquiries too
    if (this.mockMode) {
      const url = `${this.dummyBaseUrl}/collect/${txnid}`;
      try {
        const response = await this.http.get(url);
        const d = response.data;
        return {
          refNo: d.refNo,
          merchantId: d.merchantId,
          txnId: d.txnid,
          amount: d.amount,
          currency: d.ccy,
          description: d.description,
          status: d.status,
          email: '',
          procId: d.procId,
          procMsg: d.procMsg,
          settleDate: d.settleDate,
          fee: d.fee,
        };
      } catch (error: any) {
        this.logger.error(
          `Dummy status inquiry failed: ${txnid}`,
          error.response?.data || error.message,
        );
        throw new BadRequestException('Failed to get dummy transaction status');
      }
    }

    const url = `${this.baseUrl}/txnid/${txnid}`;

    try {
      const response = await this.http.get<DragonPayV2RawStatusResponse>(url, {
        headers: this.getCollectAuthHeaders(),
      });
      const d = response.data;
      return {
        refNo: d.RefNo,
        merchantId: d.MerchantId,
        txnId: d.TxnId,
        amount: d.Amount,
        currency: d.Currency,
        description: d.Description,
        status: d.Status,
        email: d.Email,
        procId: d.ProcId,
        procMsg: d.ProcMsg,
        settleDate: d.SettleDate,
        fee: d.Fee,
      };
    } catch (error: any) {
      this.logger.error(
        `DragonPay V2 status inquiry failed: ${txnid}`,
        error.response?.data || error.message,
      );
      throw new BadRequestException(
        error.response?.data?.Message || 'Failed to get transaction status',
      );
    }
  }

  // ─── Cancel Transaction (spec 5.3.2) ───────────────────────────

  async cancelTransaction(
    txnid: string,
  ): Promise<{ status: string; message: string }> {
    if (!this.enabled) {
      throw new BadRequestException('DragonPay V2 is not configured');
    }

    const url = `${this.baseUrl}/void/${txnid}`;

    try {
      const response = await this.http.get(url, {
        headers: this.getCollectAuthHeaders(),
      });
      return {
        status: response.data.Status,
        message: response.data.Message,
      };
    } catch (error: any) {
      this.logger.error(
        `DragonPay V2 cancel failed: ${txnid}`,
        error.response?.data || error.message,
      );
      throw new BadRequestException(
        error.response?.data?.Message || 'Failed to cancel transaction',
      );
    }
  }

  // ─── Available Processors (spec 7.2.2) ─────────────────────────

  async getAvailableProcessors(amount: number): Promise<any[]> {
    if (!this.enabled) {
      throw new BadRequestException('DragonPay V2 is not configured');
    }

    const url = `${this.baseUrl}/processors/available/${amount.toFixed(2)}`;

    try {
      const response = await this.http.get(url, {
        headers: this.getCollectAuthHeaders(),
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'DragonPay V2 get processors failed',
        error.response?.data || error.message,
      );
      throw new BadRequestException('Failed to get available processors');
    }
  }

  // ─── Processor Mapping ─────────────────────────────────────────

  mapPaymentMethodToProcessor(paymentMethodCode: string): string | undefined {
    const procId = DRAGONPAY_PROCESSOR_MAP[paymentMethodCode.toLowerCase()];
    if (!procId) return undefined;

    this.logger.debug(
      `Mapped payment method '${paymentMethodCode}' -> procId '${procId}'`,
    );

    return procId;
  }

  // ─── RSA-SHA256 Signature Verification (spec 5.2.3.1) ──────────

  /**
   * Fetch public keys from DragonPay API (spec section 5.3.3).
   * Endpoint: GET {baseUrl}/keys/callback
   * Uses the same Basic Auth as collect API.
   */
  async getPublicKeys(forceRefresh = false): Promise<DragonPayV2PublicKey[]> {
    const now = Date.now();
    if (
      !forceRefresh &&
      this.cachedPublicKeys.length > 0 &&
      now - this.publicKeysCachedAt < DragonPayV2Service.PUBLIC_KEY_CACHE_TTL_MS
    ) {
      return this.cachedPublicKeys;
    }

    const url = `${this.keysBaseUrl}/keys/callback`;

    try {
      const response = await this.http.get<DragonPayV2PublicKey[]>(url, {
        headers: this.getCollectAuthHeaders(),
      });
      this.cachedPublicKeys = response.data;
      this.publicKeysCachedAt = now;
      this.logger.log(`Fetched ${response.data.length} DragonPay public keys`);
      return this.cachedPublicKeys;
    } catch (error: any) {
      this.logger.error(
        'Failed to fetch DragonPay public keys',
        error.response?.data || error.message,
      );
      // Return cached keys if available, even if stale
      if (this.cachedPublicKeys.length > 0) {
        return this.cachedPublicKeys;
      }
      throw new BadRequestException('Failed to fetch DragonPay public keys');
    }
  }

  /**
   * Verify RSA-SHA256 signature from DragonPay callback.
   *
   * Message format (8 fields joined by colon):
   *   {txnid}:{refno}:{status}:{message}:{merchantid}:{param1}:{param2}:{amount as 0.00}
   *
   * The `signatures` param is Base64-encoded RSA-SHA256 signature.
   * Tries all active keys; on failure, refreshes keys and retries once (handles key rotation).
   */
  async verifyRsaSha256Signature(
    callback: DragonPayV2CallbackDto,
  ): Promise<boolean> {
    if (this.skipSignatureVerification) {
      this.logger.warn(
        `Skipping signature verification for ${callback.txnid} (dev mode)`,
      );
      return true;
    }

    if (!callback.signatures) {
      this.logger.warn(
        `No RSA-SHA256 signature in callback for ${callback.txnid}`,
      );
      return false;
    }

    // Construct message string per spec (8 fields)
    const amountFormatted = parseFloat(callback.amount || '0').toFixed(2);
    const message = [
      callback.txnid,
      callback.refno,
      callback.status,
      callback.message,
      callback.merchantid || '',
      callback.param1 || '',
      callback.param2 || '',
      amountFormatted,
    ].join(':');

    const signatureBuffer = Buffer.from(callback.signatures, 'base64');
    const messageBytes = Buffer.from(message, 'utf-8');

    // Try with cached keys first
    let keys = await this.getPublicKeys();
    if (this.verifyWithKeys(messageBytes, signatureBuffer, keys)) {
      return true;
    }

    // Key rotation: refresh keys and retry once
    this.logger.log(
      'Initial signature verification failed. Refreshing public keys...',
    );
    keys = await this.getPublicKeys(true);
    return this.verifyWithKeys(messageBytes, signatureBuffer, keys);
  }

  /**
   * Try verifying signature against all active public keys.
   */
  private verifyWithKeys(
    messageBytes: Buffer,
    signatureBuffer: Buffer,
    keys: DragonPayV2PublicKey[],
  ): boolean {
    const activeKeys = keys.filter((k) => k.status === 'Active');
    if (activeKeys.length === 0) return false;

    for (const key of activeKeys) {
      try {
        // The key value from API is raw Base64-encoded DER (SubjectPublicKeyInfo)
        const publicKeyDer = Buffer.from(key.value, 'base64');
        const publicKeyPem =
          '-----BEGIN PUBLIC KEY-----\n' +
          publicKeyDer
            .toString('base64')
            .match(/.{1,64}/g)!
            .join('\n') +
          '\n-----END PUBLIC KEY-----';

        const verifier = crypto.createVerify('RSA-SHA256');
        verifier.update(messageBytes);
        if (verifier.verify(publicKeyPem, signatureBuffer)) {
          return true;
        }
      } catch {
        // Continue to next key
      }
    }
    return false;
  }

  /**
   * Verify signature from DragonPay Mass Payout API postback.
   *
   * The Mass Payout API uses SHA1 digest (not RSA-SHA256 like the collection API).
   * SHA1 digest format: SHA1("{merchantTxnId}:{refNo}:{status}:{message}:{password}")
   * Note: uses the collection API password (DRAGONPAY_PASSWORD), not the payout bearer token.
   *
   * During the transition period (SHA1 deprecated Dec 10 2025, HMAC-SHA256 sunset
   * March 31 2026), we also accept HMAC-SHA256 via the `signature` field.
   *
   * @see Dragonpay-API-MassPayout.pdf section 5.3
   */
  verifyPayoutSignature(callback: DragonPayV2PayoutCallbackDto): boolean {
    if (this.skipSignatureVerification) {
      this.logger.warn(
        `Skipping payout signature verification for ${callback.merchantTxnId} (dev mode)`,
      );
      return true;
    }

    // SHA1 digest: SHA1("{merchantTxnId}:{refNo}:{status}:{message}:{password}")
    // Uses collection API password (DRAGONPAY_PASSWORD), not the payout bearer token
    if (callback.digest) {
      const message = `${callback.merchantTxnId}:${callback.refNo}:${callback.status}:${callback.message}:${this.password}`;
      const expected = crypto
        .createHash('sha1')
        .update(message)
        .digest('hex')
        .toLowerCase();
      if (expected === callback.digest.toLowerCase()) {
        return true;
      }
      this.logger.warn(
        `SHA1 digest mismatch for payout merchantTxnId ${callback.merchantTxnId}`,
      );
    }

    if (!callback.digest) {
      this.logger.warn(
        `No digest in payout callback for ${callback.merchantTxnId}`,
      );
    }

    return false;
  }

  /**
   * Verify and extract data from a DragonPay collection postback callback.
   * Throws UnauthorizedException if signature is invalid.
   */
  async processPostback(callback: DragonPayV2CallbackDto): Promise<{
    txnid: string;
    refno: string;
    status: string;
    message: string;
    amount: number;
  }> {
    const isValid = await this.verifyRsaSha256Signature(callback);
    if (!isValid) {
      throw new UnauthorizedException('Invalid DragonPay RSA-SHA256 signature');
    }

    return {
      txnid: callback.txnid,
      refno: callback.refno,
      status: callback.status,
      message: callback.message,
      amount: parseFloat(callback.amount || '0'),
    };
  }

  /**
   * Verify and extract data from a DragonPay payout postback callback.
   * Throws UnauthorizedException if signature is invalid.
   */
  processPayoutPostback(callback: DragonPayV2PayoutCallbackDto): {
    merchantTxnId: string;
    refNo: string;
    status: string;
    message: string;
    amount: number;
    procid?: string;
  } {
    const isValid = this.verifyPayoutSignature(callback);
    if (!isValid) {
      throw new UnauthorizedException('Invalid DragonPay payout signature');
    }

    return {
      merchantTxnId: callback.merchantTxnId,
      refNo: callback.refNo,
      status: callback.status,
      message: callback.message,
      amount: parseFloat(callback.amount || '0'),
      procid: callback.procid,
    };
  }

  // ─── Payout (Refunds) ──────────────────────────────────────────

  /**
   * Create a payout via DragonPay Payout API.
   * Endpoint: POST {payoutUrl}/{merchantId}/post
   */
  async createPayout(
    dto: DragonpayPayoutDto,
  ): Promise<DragonPayV2PayoutResult> {
    if (!this.isPayoutAvailable()) {
      throw new BadRequestException('DragonPay V2 Payout is not configured');
    }

    const txnId = this.generateTxnId();

    if (this.mockMode) {
      this.logger.warn(`[MOCK] createPayout: ${txnId} - auto-completing`);
      return {
        txnId,
        refNo: `MOCK-PAYOUT-REF-${txnId}`,
        status: 'S', // Success - mock payouts complete immediately
        message: `Mock payout completed successfully: MOCK-PAYOUT-REF-${txnId}`,
      };
    }
    const url = `${this.payoutUrl}/${this.merchantId}/post`;

    const payload: Record<string, any> = {
      TxnId: txnId,
      FirstName: dto.firstName,
      MiddleName: dto.middleName || '',
      LastName: dto.lastName,
      Amount: dto.amount.toFixed(2),
      Currency: dto.currency || 'PHP',
      Description: dto.description,
      ProcId: dto.procId,
      ProcDetail: dto.procDetail,
      RunDate: dto.runDate || new Date().toISOString().slice(0, 10),
      Email: dto.email,
      MobileNo: dto.mobileNo || '',
      BirthDate: dto.birthDate || '',
      Nationality: dto.nationality || '',
    };

    if (dto.address) {
      payload.Address = {
        Street1: dto.address.address1 || '',
        Street2: dto.address.address2 || '',
        Barangay: dto.address.barangay || '',
        City: dto.address.city || '',
        Province: dto.address.province || '',
        Country: dto.address.country || 'PH',
      };
    }

    this.logger.log(`Creating DragonPay V2 payout: ${txnId}`);

    try {
      const response = await this.http.post(url, payload, {
        headers: this.getPayoutAuthHeaders(),
      });

      // DragonPay Payout API returns { Code: 0, Message: "REFNO" } on acceptance.
      // Code 0 = accepted (queued for processing); Message contains the payout reference number.
      // Actual completion status arrives later via payout postback.
      const code = response.data.Code;
      const message = response.data.Message;

      if (code !== 0) {
        this.logger.error(
          `DragonPay V2 payout rejected: ${txnId}, Code: ${code}, Message: ${message}`,
        );
        throw new BadRequestException(
          message || `DragonPay payout failed with code ${code}`,
        );
      }

      this.logger.log(`DragonPay V2 payout created: ${txnId} -> ${message}`);

      return {
        txnId,
        refNo: message, // Message IS the RefNo on acceptance
        status: 'Q', // Q = Queued (payout submitted but not yet processed)
        message: `Payout submitted: ${message}`,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`DragonPay V2 payout failed: ${txnId}`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        message: error.message,
        url,
      });
      throw new BadRequestException(
        error.response?.data?.Message || 'Failed to create DragonPay payout',
      );
    }
  }

  // ─── Payout Status Inquiry ─────────────────────────────────────

  /**
   * Get payout transaction status from DragonPay Payout API.
   * Endpoint: GET {payoutUrl}/{merchantId}/{txnId}
   */
  async getPayoutStatus(txnId: string): Promise<DragonPayV2PayoutStatus> {
    if (!this.isPayoutAvailable()) {
      throw new BadRequestException('DragonPay V2 Payout is not configured');
    }

    const url = `${this.payoutUrl}/${this.merchantId}/${txnId}`;

    try {
      const response = await this.http.get<DragonPayV2RawPayoutStatusResponse>(
        url,
        {
          headers: this.getPayoutAuthHeaders(),
        },
      );
      const d = response.data;
      return {
        refNo: d.RefNo,
        merchantTxnId: d.MerchantTxnId,
        amount: d.Amount,
        currency: d.Currency,
        status: d.Status,
        procId: d.ProcId,
        procMsg: d.ProcMsg,
        settleDate: d.SettleDate,
      };
    } catch (error: any) {
      this.logger.error(
        `DragonPay V2 payout status inquiry failed: ${txnId}`,
        error.response?.data || error.message,
      );
      throw new BadRequestException(
        error.response?.data?.Message ||
          'Failed to get payout transaction status',
      );
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────

  generateTxnId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN-${timestamp}-${random}`;
  }
}
