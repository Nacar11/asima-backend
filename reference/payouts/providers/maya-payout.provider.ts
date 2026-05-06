import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import {
  IPayoutProvider,
  PayoutRequest,
  PayoutResult,
} from '../payout-provider.interface';
import { BankAccountEntity } from '@/bank-accounts/persistence/entities/bank-account.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { EncryptionService } from '@/utils/encryption/encryption.service';

/**
 * Maya Unified Transfer API — single fund transfer to a Philippine bank account.
 *
 * Auth: OAuth 2.0 client_credentials → Bearer token
 * Flow: POST /v1/transfers/initiate → POST /v1/transfers/{id}/confirm
 * Status poll: GET /v1/transfers/{id}
 * Async result: webhook callback (configure MAYA_PAYOUT_WEBHOOK_URL in Maya dashboard)
 *
 * Required env vars:
 *   MAYA_PAYOUT_BASE_URL       — e.g. https://pg-sandbox.paymaya.com (sandbox)
 *   MAYA_PAYOUT_CLIENT_ID      — OAuth client_id from Maya onboarding
 *   MAYA_PAYOUT_CLIENT_SECRET  — OAuth client_secret from Maya onboarding
 *
 * TODO (requires credentials + Maya onboarding):
 *   - JWS request signing (x-jws-signature header) — FAPI requirement
 *   - JWKS endpoint hosting (expose public key for Maya to verify)
 *   - Webhook handler for async transfer completion (see maya-callback.controller.ts)
 */
@Injectable()
export class MayaPayoutProvider implements IPayoutProvider {
  private readonly logger = new Logger(MayaPayoutProvider.name);
  private readonly http: AxiosInstance;

  private readonly useMock: boolean;
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
    @InjectRepository(BankAccountEntity)
    private readonly bankAccountRepository: Repository<BankAccountEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    this.useMock =
      this.configService.get<string>('USE_MOCK_MAYA', { infer: true }) ===
      'true';

    this.baseUrl = (
      this.configService.get<string>('MAYA_PAYOUT_BASE_URL', { infer: true }) ??
      ''
    ).replace(/\/+$/, '');

    this.clientId =
      this.configService.get<string>('MAYA_PAYOUT_CLIENT_ID', {
        infer: true,
      }) ?? '';
    this.clientSecret =
      this.configService.get<string>('MAYA_PAYOUT_CLIENT_SECRET', {
        infer: true,
      }) ?? '';

    this.http = axios.create({ timeout: 30_000 });
  }

  isAvailable(): boolean {
    return (
      this.useMock || !!(this.baseUrl && this.clientId && this.clientSecret)
    );
  }

  async dispatch(request: PayoutRequest): Promise<PayoutResult> {
    if (this.useMock) {
      const mockId = `MOCK-MAYA-${request.reference}`;
      this.logger.warn(
        `[MOCK] Maya payout skipped — USE_MOCK_MAYA=true. ref=${request.reference} amount=${request.amount} → ${mockId}`,
      );
      return {
        providerTxnId: mockId,
        status: 'completed',
      };
    }

    if (!this.isAvailable()) {
      throw new ServiceUnavailableException(
        'Maya payout is not configured. Set MAYA_PAYOUT_BASE_URL, MAYA_PAYOUT_CLIENT_ID, and MAYA_PAYOUT_CLIENT_SECRET.',
      );
    }

    this.logger.log(
      `Dispatching Maya payout: ref=${request.reference} amount=${request.amount} bankAccountId=${request.bankAccountId}`,
    );

    // Resolve recipient details
    const { accountNumber, bankCode, accountHolderName } =
      await this.resolveRecipient(request);

    const user = await this.userRepository.findOne({
      where: { id: request.recipientUserId },
    });
    if (!user) {
      throw new NotFoundException(`User not found: ${request.recipientUserId}`);
    }

    // Step 1: Obtain OAuth Bearer token
    const accessToken = await this.getAccessToken();

    // Step 2: Initiate transfer
    const transferId = await this.initiateTransfer({
      accessToken,
      reference: request.reference,
      amount: request.amount,
      accountNumber,
      bankCode,
      accountHolderName,
      description: request.description,
    });

    // Step 3: Confirm transfer (Maya Unified Transfer is a two-phase commit)
    await this.confirmTransfer({ accessToken, transferId });

    this.logger.log(
      `Maya payout initiated: transferId=${transferId} ref=${request.reference}`,
    );

    // Maya processes asynchronously — final status arrives via webhook callback.
    // The withdrawal stays PROCESSING until the webhook marks it COMPLETED/FAILED.
    return {
      providerTxnId: transferId,
      status: 'processing',
    };
  }

  // ── OAuth ────────────────────────────────────────────────────────────────────

  private async getAccessToken(): Promise<string> {
    const url = `${this.baseUrl}/v1/oauth2/token`;
    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString('base64');

    const response = await this.http
      .post(url, new URLSearchParams({ grant_type: 'client_credentials' }), {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .catch((err) => {
        this.logger.error(
          `Maya OAuth token request failed: ${err?.response?.data ? JSON.stringify(err.response.data) : err.message}`,
        );
        throw new ServiceUnavailableException(
          'Maya payout authentication failed. Check MAYA_PAYOUT_CLIENT_ID and MAYA_PAYOUT_CLIENT_SECRET.',
        );
      });

    const token = response.data?.access_token;
    if (!token) {
      throw new ServiceUnavailableException(
        'Maya OAuth response did not include access_token.',
      );
    }
    return String(token);
  }

  // ── Initiate ────────────────────────────────────────────────────────────────

  private async initiateTransfer(params: {
    accessToken: string;
    reference: string;
    amount: number;
    accountNumber: string;
    bankCode: string;
    accountHolderName: string;
    description: string;
  }): Promise<string> {
    const url = `${this.baseUrl}/v1/transfers/initiate`;

    const payload = {
      account: {
        number: params.accountNumber,
        customer_name: params.accountHolderName,
      },
      amount: {
        value: Number(params.amount.toFixed(2)),
        currency: 'PHP',
      },
      recipient_bank: {
        code: params.bankCode,
      },
      requestReferenceNumber: params.reference,
      remarks: params.description,
    };

    // TODO: Add JWS request signing (x-jws-signature header) once JWKS endpoint
    // is configured during Maya onboarding. See Maya FAPI docs.

    const response = await this.http
      .post(url, payload, {
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': params.reference,
        },
      })
      .catch((err) => {
        const detail = err?.response?.data
          ? JSON.stringify(err.response.data)
          : err.message;
        this.logger.error(`Maya transfer initiate failed: ${detail}`);
        throw new BadRequestException(
          `Maya payout initiation failed: ${detail}`,
        );
      });

    const transferId = response.data?.transferId ?? response.data?.id;
    if (!transferId) {
      throw new BadRequestException(
        'Maya transfer initiate response did not include a transferId.',
      );
    }
    return String(transferId);
  }

  // ── Confirm ─────────────────────────────────────────────────────────────────

  private async confirmTransfer(params: {
    accessToken: string;
    transferId: string;
  }): Promise<void> {
    const url = `${this.baseUrl}/v1/transfers/${encodeURIComponent(params.transferId)}/confirm`;

    await this.http
      .post(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${params.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      )
      .catch((err) => {
        const detail = err?.response?.data
          ? JSON.stringify(err.response.data)
          : err.message;
        this.logger.error(
          `Maya transfer confirm failed for transferId=${params.transferId}: ${detail}`,
        );
        throw new BadRequestException(
          `Maya payout confirmation failed: ${detail}`,
        );
      });
  }

  // ── Status poll (for manual reconciliation) ──────────────────────────────────

  async getTransferStatus(transferId: string): Promise<{
    status: string;
    raw: Record<string, any>;
  }> {
    const accessToken = await this.getAccessToken();
    const url = `${this.baseUrl}/v1/transfers/${encodeURIComponent(transferId)}`;

    const response = await this.http.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      status: String(response.data?.status ?? '').toUpperCase(),
      raw: response.data as Record<string, any>,
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private async resolveRecipient(request: PayoutRequest): Promise<{
    accountNumber: string;
    bankCode: string;
    accountHolderName: string;
  }> {
    if (request.bankAccountId) {
      const bankAccount = await this.bankAccountRepository.findOne({
        where: { id: request.bankAccountId },
        relations: ['bank'],
      });
      if (!bankAccount) {
        throw new NotFoundException(
          `Bank account #${request.bankAccountId} not found`,
        );
      }
      if (!bankAccount.bank?.bank_code) {
        throw new NotFoundException(
          `Bank code not found for bank account #${request.bankAccountId}`,
        );
      }
      return {
        accountNumber: this.encryptionService.decrypt(
          bankAccount.account_number_encrypted,
        ),
        bankCode: bankAccount.bank.bank_code,
        accountHolderName: bankAccount.account_holder_name,
      };
    }

    if (request.adHocProcId && request.adHocProcDetail) {
      return {
        accountNumber: request.adHocProcDetail,
        bankCode: request.adHocProcId,
        accountHolderName: request.notes ?? '',
      };
    }

    throw new BadRequestException(
      'Either bankAccountId or adHocProcId + adHocProcDetail must be provided',
    );
  }
}
