import {
  Injectable,
  NotFoundException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  CreatePaymentRequestDto,
  PaymentResponseDto,
  TransactionStatusResponseDto,
  GetProcessorsDto,
  GetProcessorsResponseDto,
  ProcessorDto,
  SimulatePaymentDto,
  SimulatePaymentResponseDto,
  PostbackCallbackDto,
  CreatePayoutRequestDto,
  PayoutResponseDto,
  PayoutStatusResponseDto,
  SimulatePayoutDto,
  SimulatePayoutResponseDto,
} from './dto';
import { DragonPayStatusEnum } from './enums/dragonpay-status.enum';
import {
  DragonPayCurrencyEnum,
  DragonPayModeEnum,
  DragonPayProcessorEnum,
} from './enums/dragonpay-processor.enum';

/**
 * Stored payout for dummy DragonPay
 */
export interface StoredPayout {
  txnId: string;
  refNo: string;
  firstName: string;
  middleName: string;
  lastName: string;
  amount: number;
  currency: string;
  description: string;
  procId: string;
  procDetail: string;
  email: string;
  status: DragonPayStatusEnum;
  createdAt: Date;
  settleDate?: string;
  procMsg?: string;
}

/**
 * Stored transaction for dummy DragonPay
 */
interface StoredTransaction {
  txnid: string;
  refNo: string;
  amount: number;
  ccy: DragonPayCurrencyEnum;
  description: string;
  email: string;
  status: DragonPayStatusEnum;
  createdAt: Date;
  procId?: string;
  postbackUrl?: string;
  returnUrl?: string;
  cancelUrl?: string;
  param1?: string;
  param2?: string;
  mobileNo?: string;
  paidAt?: Date;
  settleDate?: string;
}

/**
 * DragonPay Dummy Service
 *
 * Simulates DragonPay Payment Gateway API for development/testing.
 * Stores transactions in-memory (resets on server restart).
 *
 * This is intended for use while waiting for production DragonPay credentials.
 */
@Injectable()
export class DragonPayDummyService implements OnModuleInit {
  private readonly logger = new Logger(DragonPayDummyService.name);
  private transactions: Map<string, StoredTransaction> = new Map();
  private refNoToTxnId: Map<string, string> = new Map();
  private payouts: Map<string, StoredPayout> = new Map();

  private readonly dummyMerchantId = 'TRAVAJO_TEST';
  private readonly dummySecretKey = 'travajo_dummy_secret_key_2026';
  private readonly basePaymentUrl: string;

  // RSA key pair generated at startup for real signature verification
  private rsaPrivateKey: string = '';
  private rsaPublicKeyDerBase64: string = '';

  constructor(private readonly configService: ConfigService) {
    const appUrl =
      this.configService.get<string>('APP_URL', { infer: true }) ||
      'http://localhost:4080';
    this.basePaymentUrl = `${appUrl}/api/v1/dragonpay-dummy/pay`;
    this.logger.log('DragonPay Dummy Service initialized');
  }

  private getBasePaymentUrl(publicBaseUrl?: string): string {
    if (!publicBaseUrl) {
      return this.basePaymentUrl;
    }
    const normalizedBaseUrl = String(publicBaseUrl).trim().replace(/\/+$/, '');
    if (!normalizedBaseUrl) {
      return this.basePaymentUrl;
    }
    return `${normalizedBaseUrl}/api/v1/dragonpay-dummy/pay`;
  }

  onModuleInit() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    this.rsaPrivateKey = privateKey;
    this.rsaPublicKeyDerBase64 = (publicKey as Buffer).toString('base64');
    this.logger.log(
      'Generated RSA-2048 key pair for callback signature verification',
    );
  }

  /**
   * Returns the public key in DragonPay /keys/callback format.
   * The real DragonPay API returns an array of key objects.
   */
  getPublicKeys(): { value: string; status: 'Active' | 'Revoked' }[] {
    return [{ value: this.rsaPublicKeyDerBase64, status: 'Active' }];
  }

  /**
   * Sign a callback message with the dummy RSA private key.
   * Message format matches DragonPay spec (8 fields joined by colon).
   */
  private signCallback(
    txnid: string,
    refno: string,
    status: string,
    message: string,
    merchantid: string,
    param1: string,
    param2: string,
    amount: number,
  ): string {
    const msg = [
      txnid,
      refno,
      status,
      message,
      merchantid,
      param1,
      param2,
      amount.toFixed(2),
    ].join(':');
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(Buffer.from(msg, 'utf-8'));
    return signer.sign(this.rsaPrivateKey, 'base64');
  }

  /**
   * Create a payment request
   * Simulates DragonPay API Section 5.2
   */
  createPayment(dto: CreatePaymentRequestDto): PaymentResponseDto {
    console.log(
      'Dummy service received payload:',
      JSON.stringify(dto, null, 2),
    );

    // Check for duplicate transaction
    if (this.transactions.has(dto.txnid)) {
      throw new Error(`Duplicate transaction ID: ${dto.txnid}`);
    }

    // Generate reference number
    const refNo = this.generateRefNo();

    // Store transaction
    const transaction: StoredTransaction = {
      txnid: dto.txnid,
      refNo,
      amount: dto.amount,
      ccy: dto.ccy || DragonPayCurrencyEnum.PHP,
      description: dto.description,
      email: dto.email,
      status: DragonPayStatusEnum.PENDING,
      createdAt: new Date(),
      procId: dto.procId,
      postbackUrl: dto.postbackUrl,
      returnUrl: dto.returnUrl,
      cancelUrl: dto.cancelUrl,
      param1: dto.param1,
      param2: dto.param2,
      mobileNo: dto.mobileNo,
    };

    this.transactions.set(dto.txnid, transaction);
    this.refNoToTxnId.set(refNo, dto.txnid);

    this.logger.log(`Created dummy payment: ${dto.txnid} -> ${refNo}`);

    // Generate payment URL
    const basePaymentUrl = this.getBasePaymentUrl(dto.publicBaseUrl);
    const paymentUrl = `${basePaymentUrl}?txnid=${encodeURIComponent(dto.txnid)}&refno=${encodeURIComponent(refNo)}`;

    return {
      refNo,
      url: paymentUrl,
      message: 'Transaction created successfully',
    };
  }

  /**
   * Get transaction status
   * Simulates DragonPay API Section 5.3.1
   */
  getTransactionStatus(txnid: string): TransactionStatusResponseDto {
    const transaction = this.transactions.get(txnid);

    if (!transaction) {
      throw new NotFoundException(`Transaction ${txnid} not found`);
    }

    return {
      refNo: transaction.refNo,
      merchantId: this.dummyMerchantId,
      txnid: transaction.txnid,
      amount: transaction.amount,
      ccy: transaction.ccy,
      description: transaction.description,
      status: transaction.status,
      date: transaction.createdAt.toISOString(),
      procId: transaction.procId,
      procMsg:
        transaction.status === DragonPayStatusEnum.SUCCESS
          ? 'Payment processed successfully'
          : undefined,
      settleDate: transaction.settleDate,
      mobileNo: transaction.mobileNo,
      fee:
        transaction.status === DragonPayStatusEnum.SUCCESS
          ? transaction.amount * 0.025
          : undefined,
    };
  }

  /**
   * Cancel a transaction
   * Simulates DragonPay API Section 5.3.2
   */
  cancelTransaction(txnid: string): { refNo: string; message: string } {
    const transaction = this.transactions.get(txnid);

    if (!transaction) {
      throw new NotFoundException(`Transaction ${txnid} not found`);
    }

    if (transaction.status === DragonPayStatusEnum.SUCCESS) {
      throw new Error('Cannot cancel a completed transaction');
    }

    transaction.status = DragonPayStatusEnum.VOID;
    this.transactions.set(txnid, transaction);

    this.logger.log(`Cancelled transaction: ${txnid}`);

    return {
      refNo: transaction.refNo,
      message: 'Transaction cancelled successfully',
    };
  }

  /**
   * Get available payment processors
   * Simulates DragonPay API Section 7.2.2
   */
  getAvailableProcessors(dto: GetProcessorsDto): GetProcessorsResponseDto {
    const allProcessors: ProcessorDto[] = [
      {
        procId: DragonPayProcessorEnum.GCASH,
        shortName: 'GCash',
        longName: 'GCash Mobile Payment',
        logo: 'https://dragonpay.ph/logos/gcash.png',
        currencies: ['PHP'],
        realTime: true,
        hasPin: false,
        dayMin: 0,
        dayMax: 0,
        amtMin: 1,
        amtMax: 50000,
        cost: 2.5,
        type: 'e-wallet',
      },
      {
        procId: DragonPayProcessorEnum.PAYMAYA,
        shortName: 'Maya',
        longName: 'Maya (PayMaya)',
        logo: 'https://dragonpay.ph/logos/maya.png',
        currencies: ['PHP'],
        realTime: true,
        hasPin: false,
        dayMin: 0,
        dayMax: 0,
        amtMin: 1,
        amtMax: 50000,
        cost: 2.5,
        type: 'e-wallet',
      },
      {
        procId: DragonPayProcessorEnum.GRABPAY,
        shortName: 'GrabPay',
        longName: 'GrabPay Wallet',
        logo: 'https://dragonpay.ph/logos/grabpay.png',
        currencies: ['PHP'],
        realTime: true,
        hasPin: false,
        dayMin: 0,
        dayMax: 0,
        amtMin: 1,
        amtMax: 30000,
        cost: 2.5,
        type: 'e-wallet',
      },
      {
        procId: DragonPayProcessorEnum.SHOPEEPAY,
        shortName: 'ShopeePay',
        longName: 'ShopeePay Wallet',
        logo: 'https://dragonpay.ph/logos/shopeepay.png',
        currencies: ['PHP'],
        realTime: true,
        hasPin: false,
        dayMin: 0,
        dayMax: 0,
        amtMin: 1,
        amtMax: 50000,
        cost: 2.0,
        type: 'e-wallet',
      },
      {
        procId: DragonPayProcessorEnum.BPI,
        shortName: 'BPI',
        longName: 'Bank of the Philippine Islands',
        logo: 'https://dragonpay.ph/logos/bpi.png',
        currencies: ['PHP'],
        realTime: true,
        hasPin: true,
        dayMin: 0,
        dayMax: 1,
        amtMin: 100,
        amtMax: 500000,
        cost: 1.5,
        type: 'online-banking',
      },
      {
        procId: DragonPayProcessorEnum.BDO,
        shortName: 'BDO',
        longName: 'Banco de Oro',
        logo: 'https://dragonpay.ph/logos/bdo.png',
        currencies: ['PHP'],
        realTime: true,
        hasPin: true,
        dayMin: 0,
        dayMax: 1,
        amtMin: 100,
        amtMax: 500000,
        cost: 1.5,
        type: 'online-banking',
      },
      {
        procId: DragonPayProcessorEnum.SEVEN_ELEVEN,
        shortName: '7-Eleven',
        longName: '7-Eleven CLIQQ',
        logo: 'https://dragonpay.ph/logos/711.png',
        currencies: ['PHP'],
        realTime: false,
        hasPin: false,
        dayMin: 0,
        dayMax: 2,
        amtMin: 100,
        amtMax: 10000,
        cost: 15,
        type: 'otc',
        remarks: 'Over-the-counter payment at 7-Eleven stores',
      },
      {
        procId: DragonPayProcessorEnum.BAYAD_CENTER,
        shortName: 'Bayad Center',
        longName: 'Bayad Center',
        logo: 'https://dragonpay.ph/logos/bayadcenter.png',
        currencies: ['PHP'],
        realTime: false,
        hasPin: false,
        dayMin: 0,
        dayMax: 2,
        amtMin: 100,
        amtMax: 50000,
        cost: 25,
        type: 'otc',
      },
    ];

    // Filter by amount
    let filtered = allProcessors.filter(
      (p) => dto.amount >= p.amtMin && dto.amount <= p.amtMax,
    );

    // Filter by currency
    if (dto.ccy) {
      filtered = filtered.filter((p) => p.currencies.includes(dto.ccy!));
    }

    // Filter by mode
    if (dto.mode) {
      const onlineTypes = ['e-wallet', 'online-banking'];
      const offlineTypes = ['otc'];
      filtered = filtered.filter((p) =>
        dto.mode === DragonPayModeEnum.ONLINE
          ? onlineTypes.includes(p.type)
          : offlineTypes.includes(p.type),
      );
    }

    return { processors: filtered };
  }

  /**
   * Simulate payment completion
   * For testing purposes - triggers a callback to postbackUrl
   */
  simulatePayment(dto: SimulatePaymentDto): SimulatePaymentResponseDto {
    const transaction = this.transactions.get(dto.txnid);

    if (!transaction) {
      throw new NotFoundException(`Transaction ${dto.txnid} not found`);
    }

    // Update transaction status
    transaction.status = dto.status;
    if (dto.status === DragonPayStatusEnum.SUCCESS) {
      transaction.paidAt = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      transaction.settleDate = tomorrow.toISOString().split('T')[0];
    }
    this.transactions.set(dto.txnid, transaction);

    this.logger.log(`Simulated payment ${dto.txnid} with status ${dto.status}`);

    // If postbackUrl is set, trigger webhook after delay
    if (transaction.postbackUrl && dto.delay) {
      setTimeout(async () => {
        await this.sendPostback(transaction);
      }, dto.delay);
    } else if (transaction.postbackUrl) {
      // Immediate postback (non-blocking)
      setImmediate(async () => {
        await this.sendPostback(transaction);
      });
    }

    return {
      success: true,
      message: transaction.postbackUrl
        ? 'Payment simulation queued - postback will be sent'
        : 'Payment simulation completed - no postbackUrl configured',
      txnid: dto.txnid,
      refNo: transaction.refNo,
      simulatedStatus: dto.status,
    };
  }

  /**
   * Verify postback callback signature
   * For testing webhook verification
   */
  verifyPostback(callback: PostbackCallbackDto): boolean {
    if (!callback.signature) {
      return false;
    }

    const expectedSignature = this.generateSignature(
      callback.txnid,
      callback.refno,
      callback.status,
      callback.message,
      callback.amount || 0,
    );

    return callback.signature === expectedSignature;
  }

  /**
   * Get payment page data for rendering
   * Used by the dummy payment page endpoint
   */
  getPaymentPageData(txnid: string): StoredTransaction | null {
    return this.transactions.get(txnid) || null;
  }

  /**
   * Process payment from dummy payment page
   * Marks transaction as successful and returns redirect URL
   */
  processPaymentFromPage(
    txnid: string,
    status: DragonPayStatusEnum,
  ): { redirectUrl: string } {
    const transaction = this.transactions.get(txnid);

    if (!transaction) {
      throw new NotFoundException(`Transaction ${txnid} not found`);
    }

    // Update status
    transaction.status = status;
    if (status === DragonPayStatusEnum.SUCCESS) {
      transaction.paidAt = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      transaction.settleDate = tomorrow.toISOString().split('T')[0];
    }
    this.transactions.set(txnid, transaction);

    // Send postback if configured
    if (transaction.postbackUrl) {
      this.logger.log(
        `Postback URL configured: ${transaction.postbackUrl}, scheduling postback...`,
      );
      setImmediate(async () => {
        try {
          await this.sendPostback(transaction);
        } catch (error) {
          this.logger.error('Error in setImmediate postback:', error);
        }
      });
    } else {
      this.logger.warn(`No postback URL configured for transaction ${txnid}`);
    }

    // Build V2-style redirect with all callback query params
    const redirectBase =
      status === DragonPayStatusEnum.VOID && transaction.cancelUrl
        ? transaction.cancelUrl
        : transaction.returnUrl;

    if (redirectBase) {
      const url = new URL(redirectBase);
      url.searchParams.set('txnid', txnid);
      url.searchParams.set('refno', transaction.refNo);
      url.searchParams.set('status', status);
      url.searchParams.set(
        'message',
        status === DragonPayStatusEnum.SUCCESS
          ? 'Transaction successful'
          : 'Transaction failed',
      );
      url.searchParams.set('merchantid', this.dummyMerchantId);
      url.searchParams.set('param1', transaction.param1 || '');
      url.searchParams.set('param2', transaction.param2 || '');
      url.searchParams.set('amount', transaction.amount.toFixed(2));
      url.searchParams.set('ccy', transaction.ccy || 'PHP');
      url.searchParams.set('procid', transaction.procId || '');
      return { redirectUrl: url.toString() };
    }

    // Default redirect
    const appUrl =
      this.configService.get<string>('APP_URL', { infer: true }) ||
      'http://localhost:4080';
    return {
      redirectUrl: `${appUrl}/api/v1/dragonpay-dummy/complete?txnid=${txnid}&status=${status}`,
    };
  }

  /**
   * Get all transactions (for debugging)
   */
  getAllTransactions(): StoredTransaction[] {
    return Array.from(this.transactions.values());
  }

  /**
   * Clear all transactions (for testing)
   */
  clearTransactions(): void {
    this.transactions.clear();
    this.refNoToTxnId.clear();
    this.payouts.clear();
    this.logger.log('Cleared all dummy transactions and payouts');
  }

  // ═══════════════════════════════════════════════════════════════════
  // Payout API Mock
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Create a payout request.
   * Simulates POST {payoutUrl}/{merchantId}/post
   * Returns { Code: 0, Message: refNo } on success.
   */
  createPayout(dto: CreatePayoutRequestDto): PayoutResponseDto {
    if (this.payouts.has(dto.TxnId)) {
      return { Code: -8, Message: 'Similar transaction id already exists' };
    }

    const refNo = this.generateRefNo();

    const payout: StoredPayout = {
      txnId: dto.TxnId,
      refNo,
      firstName: dto.FirstName,
      middleName: dto.MiddleName || '',
      lastName: dto.LastName,
      amount:
        typeof dto.Amount === 'string' ? parseFloat(dto.Amount) : dto.Amount,
      currency: dto.Currency || 'PHP',
      description: dto.Description,
      procId: dto.ProcId,
      procDetail: dto.ProcDetail,
      email: dto.Email,
      status: DragonPayStatusEnum.PENDING,
      createdAt: new Date(),
    };

    this.payouts.set(dto.TxnId, payout);
    this.logger.log(
      `Created dummy payout: ${dto.TxnId} -> ${refNo} (${dto.ProcId}/${dto.ProcDetail})`,
    );

    return { Code: 0, Message: refNo };
  }

  /**
   * Get payout status.
   * Simulates GET {payoutUrl}/{merchantId}/{txnId}
   * Returns PascalCase response matching DragonPayV2RawPayoutStatusResponse.
   */
  getPayoutStatus(txnId: string): PayoutStatusResponseDto {
    const payout = this.payouts.get(txnId);

    if (!payout) {
      throw new NotFoundException(`Payout transaction ${txnId} not found`);
    }

    return {
      RefNo: payout.refNo,
      MerchantId: this.dummyMerchantId,
      MerchantTxnId: payout.txnId,
      Amount: payout.amount,
      Currency: payout.currency,
      Description: payout.description,
      Status: payout.status,
      ProcId: payout.procId,
      ProcDetail: payout.procDetail,
      ProcMsg: payout.procMsg,
      SettleDate: payout.settleDate,
      Fee:
        payout.status === DragonPayStatusEnum.SUCCESS
          ? payout.amount * 0.01
          : undefined,
    };
  }

  /**
   * Simulate payout status change.
   * Test helper to transition a payout to S/F/V without a real bank.
   */
  simulatePayout(dto: SimulatePayoutDto): SimulatePayoutResponseDto {
    const payout = this.payouts.get(dto.txnId);

    if (!payout) {
      throw new NotFoundException(`Payout transaction ${dto.txnId} not found`);
    }

    payout.status = dto.status;
    payout.procMsg =
      dto.procMsg ||
      (dto.status === DragonPayStatusEnum.SUCCESS
        ? 'Payout credited successfully'
        : dto.status === DragonPayStatusEnum.FAILURE
          ? 'Payout failed - insufficient funds'
          : `Status changed to ${dto.status}`);

    if (dto.status === DragonPayStatusEnum.SUCCESS) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      payout.settleDate = tomorrow.toISOString().split('T')[0];
    }

    this.payouts.set(dto.txnId, payout);
    this.logger.log(`Simulated payout ${dto.txnId} -> ${dto.status}`);

    return {
      success: true,
      message: `Payout simulation completed`,
      txnId: dto.txnId,
      refNo: payout.refNo,
      simulatedStatus: dto.status,
    };
  }

  /**
   * Get all payouts (for debugging)
   */
  getAllPayouts(): StoredPayout[] {
    return Array.from(this.payouts.values());
  }

  // Private helper methods

  private generateRefNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `DPREF-${dateStr}-${randomStr}`;
  }

  private generateSignature(
    txnid: string,
    refno: string,
    status: string,
    message: string,
    amount: number,
  ): string {
    const data = `${txnid}:${refno}:${status}:${message}:${amount.toFixed(2)}`;
    return crypto
      .createHmac('sha256', this.dummySecretKey)
      .update(data)
      .digest('hex');
  }

  /**
   * Send postback as HTTP GET with query params (V2 format).
   *
   * DragonPay V2 sends callbacks as HTTP GET with all fields as query params.
   * The dummy module mimics this behavior for local testing.
   */
  private async sendPostback(transaction: StoredTransaction): Promise<void> {
    if (!transaction.postbackUrl) return;

    const message =
      transaction.status === DragonPayStatusEnum.SUCCESS
        ? 'Transaction successful'
        : 'Transaction failed';

    // Build V2 callback query params (all lowercase per spec)
    const params = new URLSearchParams({
      txnid: transaction.txnid,
      refno: transaction.refNo,
      status: transaction.status,
      message,
      amount: transaction.amount.toFixed(2),
      ccy: transaction.ccy || 'PHP',
      procid: transaction.procId || '',
      settledate: transaction.settleDate || '',
      merchantid: this.dummyMerchantId,
      param1: transaction.param1 || '',
      param2: transaction.param2 || '',
      digest: '', // Deprecated
      signature: '', // HMAC-SHA256 (sunset March 2026)
      signatures: this.signCallback(
        transaction.txnid,
        transaction.refNo,
        transaction.status,
        message,
        this.dummyMerchantId,
        transaction.param1 || '',
        transaction.param2 || '',
        transaction.amount,
      ),
    });

    const url = `${transaction.postbackUrl}?${params.toString()}`;

    this.logger.log(`Sending V2 postback to: ${url}`);

    try {
      const response = await fetch(url, { method: 'GET' });

      const body = await response.text();
      this.logger.log(
        `V2 postback GET sent to ${transaction.postbackUrl}: ${response.status} -> ${body}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send V2 postback to ${transaction.postbackUrl}:`,
        error,
      );
    }
  }
}
