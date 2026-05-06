import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, QueryRunner } from 'typeorm';
import { AllConfigType } from '@/config/config.type';
import { Transaction } from '@/utils/typeorm/decorators/transaction.decorator';
import { User } from '@/users/domain/user';
import { VouchersService } from '@/vouchers/vouchers.service';
import { BaseReferralCodeRepository } from '@/referral-codes/persistence/base-referral-code.repository';
import { BaseReferralCodeUsageRepository } from '@/referral-codes/persistence/base-referral-code-usage.repository';
import { BaseReferralCodeUsageSelectionRepository } from '@/referral-codes/persistence/base-referral-code-usage-selection.repository';
import { ReferralCode } from '@/referral-codes/domain/referral-code';
import { ReferralCodeUsage } from '@/referral-codes/domain/referral-code-usage';
import { CreateReferralCodeDto } from '@/referral-codes/dto/create-referral-code.dto';
import { UpdateReferralCodeDto } from '@/referral-codes/dto/update-referral-code.dto';
import { QueryReferralCodeDto } from '@/referral-codes/dto/query-referral-code.dto';
import { ValidateReferralCodeResponseDto } from '@/referral-codes/dto/validate-referral-code-response.dto';
import { ReferralCodeStatusEnum } from '@/referral-codes/enums/referral-code-status.enum';
import { ReferralCodeSelectionModeEnum } from '@/referral-codes/enums/referral-code-selection-mode.enum';
import { ReferralCodeUsageSelectionStatusEnum } from '@/referral-codes/enums/referral-code-usage-selection-status.enum';
@Injectable()
export class ReferralCodesService {
  private readonly logger = new Logger(ReferralCodesService.name);

  constructor(
    private readonly referralCodeRepository: BaseReferralCodeRepository,
    private readonly referralCodeUsageRepository: BaseReferralCodeUsageRepository,
    private readonly referralCodeUsageSelectionRepository: BaseReferralCodeUsageSelectionRepository,
    private readonly vouchersService: VouchersService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly _dataSource: DataSource,
  ) {}

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  async create(dto: CreateReferralCodeDto, causer: User): Promise<ReferralCode> {
    const referralCode = await this.referralCodeRepository.create({
      code: dto.code,
      description: dto.description ?? null,
      status: dto.status ?? ReferralCodeStatusEnum.ACTIVE,
      usage_limit: dto.usage_limit ?? null,
      usage_count: 0,
      expires_at: null,
      selection_mode: dto.selection_mode,
      max_voucher_selections: dto.max_voucher_selections ?? null,
      selection_timeout_hours: dto.selection_timeout_hours ?? null,
      created_by: causer.id,
      updated_by: causer.id,
      deleted_by: null,
    });

    if (dto.voucher_ids && dto.voucher_ids.length > 0) {
      await this.referralCodeRepository.saveVoucherLinks(
        referralCode.id,
        dto.voucher_ids,
      );
    }

    return this.referralCodeRepository.findById(referralCode.id) as Promise<ReferralCode>;
  }

  async findAll(
    query: QueryReferralCodeDto,
  ): Promise<{ data: ReferralCode[]; total: number }> {
    return this.referralCodeRepository.findAll(query);
  }

  async findById(id: number): Promise<ReferralCode> {
    const code = await this.referralCodeRepository.findById(id);
    if (!code) throw new NotFoundException(`Referral code #${id} not found`);
    return code;
  }

  async update(
    id: number,
    dto: UpdateReferralCodeDto,
    causer: User,
  ): Promise<ReferralCode> {
    await this.findById(id);

    const patch: Partial<ReferralCode> = { updated_by: causer.id };
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.usage_limit !== undefined) patch.usage_limit = dto.usage_limit;
    if (dto.max_voucher_selections !== undefined) {
      patch.max_voucher_selections = dto.max_voucher_selections;
    }
    if (dto.selection_timeout_hours !== undefined) {
      patch.selection_timeout_hours = dto.selection_timeout_hours;
    }

    await this.referralCodeRepository.update(id, patch);

    if (dto.voucher_ids !== undefined) {
      await this.referralCodeRepository.replaceVoucherLinks(id, dto.voucher_ids);
    }

    return this.referralCodeRepository.findById(id) as Promise<ReferralCode>;
  }

  async softDelete(id: number, causer: User): Promise<void> {
    await this.findById(id);
    await this.referralCodeRepository.update(id, { deleted_by: causer.id });
    await this.referralCodeRepository.softDelete(id);
  }

  async findUsersForCode(
    codeId: number,
    query: QueryReferralCodeDto,
  ): Promise<{ data: ReferralCodeUsage[]; total: number }> {
    await this.findById(codeId);
    return this.referralCodeUsageRepository.findByReferralCodeId(
      codeId,
      query.skip ?? 0,
      query.take ?? 20,
    );
  }

  // ─── Validate (public) ───────────────────────────────────────────────────────

  async validateCode(code: string): Promise<ValidateReferralCodeResponseDto> {
    const referralCode = await this.referralCodeRepository.findByCode(code);
    if (!referralCode || !referralCode.isValid()) {
      return { is_valid: false };
    }
    return { is_valid: true, description: referralCode.description ?? undefined };
  }

  // ─── Registration flow ───────────────────────────────────────────────────────

  @Transaction()
  async applyReferralCode(
    code: string,
    user: User,
    queryRunner?: QueryRunner,
  ): Promise<{ selectionPending: boolean; usageId: number }> {
    const referralCode = await this.referralCodeRepository.findByCode(
      code,
      queryRunner,
    );

    if (!referralCode || !referralCode.isValid()) {
      throw new UnprocessableEntityException('Invalid or expired referral code');
    }

    await this.referralCodeRepository.incrementUsage(referralCode.id, queryRunner);

    const isUserSelectionPending =
      referralCode.selection_mode === ReferralCodeSelectionModeEnum.USER_SELECTION &&
      referralCode.voucher_ids.length > 0;

    const isAutoAssign =
      referralCode.selection_mode === ReferralCodeSelectionModeEnum.AUTO_ASSIGN &&
      referralCode.voucher_ids.length > 0;

    const selectionDeadline =
      isUserSelectionPending && referralCode.selection_timeout_hours
        ? new Date(Date.now() + referralCode.selection_timeout_hours * 3_600_000)
        : null;

    const selectionStatus = isUserSelectionPending
      ? ReferralCodeUsageSelectionStatusEnum.PENDING
      : isAutoAssign
        ? ReferralCodeUsageSelectionStatusEnum.AUTO_ASSIGNED
        : ReferralCodeUsageSelectionStatusEnum.NOT_APPLICABLE;

    const usage = await this.referralCodeUsageRepository.create(
      {
        referral_code_id: referralCode.id,
        user_id: user.id,
        selection_status: selectionStatus,
        selection_deadline: selectionDeadline,
      },
      queryRunner,
    );

    if (!isUserSelectionPending) {
      const selections: Array<{ referral_code_usage_id: number; voucher_id: number }> = [];
      for (const voucherId of referralCode.voucher_ids) {
        await this.vouchersService.giftVoucherToUser(voucherId, user.id, queryRunner);
        selections.push({ referral_code_usage_id: usage.id, voucher_id: voucherId });
      }
      if (selections.length > 0) {
        await this.referralCodeUsageSelectionRepository.createBulk(selections, queryRunner);
      }
    }

    this.logger.log(
      `Referral code ${code} applied for user ${user.id}. selectionPending=${isUserSelectionPending}`,
    );

    return { selectionPending: isUserSelectionPending, usageId: usage.id };
  }

  // ─── Voucher selection ───────────────────────────────────────────────────────

  async getSelectableVouchers(
    usageId: number,
    user: User,
  ): Promise<{
    referral_code: string;
    selection_status: string;
    vouchers: Array<{ id: number; code: string; discount_type: string; discount_value: number; description: string | null; expires_at: Date | null }>;
    max_selections: number;
    remaining: number;
  }> {
    const usage = await this.referralCodeUsageRepository.findById(usageId);
    if (!usage || usage.user_id !== user.id) throw new NotFoundException();

    if (usage.selection_status !== ReferralCodeUsageSelectionStatusEnum.PENDING) {
      throw new UnprocessableEntityException('Voucher selection is no longer available');
    }

    const referralCode = await this.referralCodeRepository.findById(
      usage.referral_code_id,
    );
    if (!referralCode) throw new NotFoundException();

    const now = new Date();
    const availableVouchers = await Promise.all(
      referralCode.voucher_ids.map((id) => this.vouchersService.findById(id)),
    );

    const nonExpired = availableVouchers.filter(
      (v) => !v.expires_at || v.expires_at > now,
    );

    const maxSelections = referralCode.max_voucher_selections ?? 1;

    return {
      referral_code: referralCode.code,
      selection_status: usage.selection_status,
      vouchers: nonExpired.map((v) => ({
        id: v.id,
        code: v.code,
        discount_type: v.discount_type,
        discount_value: v.discount_value,
        description: v.description ?? null,
        expires_at: v.expires_at ?? null,
      })),
      max_selections: maxSelections,
      remaining: maxSelections,
    };
  }

  async selectVouchers(
    usageId: number,
    voucherIds: number[],
    user: User,
  ): Promise<void> {
    const usage = await this.referralCodeUsageRepository.findById(usageId);
    if (!usage || usage.user_id !== user.id) throw new NotFoundException();

    if (usage.selection_status !== ReferralCodeUsageSelectionStatusEnum.PENDING) {
      throw new UnprocessableEntityException(
        'Voucher selection is no longer available',
      );
    }

    const referralCode = await this.referralCodeRepository.findById(
      usage.referral_code_id,
    );
    if (!referralCode) throw new NotFoundException();

    const maxSelections = referralCode.max_voucher_selections ?? 1;
    if (voucherIds.length > maxSelections) {
      throw new UnprocessableEntityException(
        `Maximum ${maxSelections} voucher(s) allowed`,
      );
    }

    const now = new Date();
    const selections: Array<{ referral_code_usage_id: number; voucher_id: number }> = [];

    for (const voucherId of voucherIds) {
      if (!referralCode.voucher_ids.includes(voucherId)) {
        throw new UnprocessableEntityException('Invalid voucher selection');
      }
      const voucher = await this.vouchersService.findById(voucherId);
      if (voucher.expires_at && voucher.expires_at <= now) {
        throw new UnprocessableEntityException(
          `Voucher ${voucherId} has expired`,
        );
      }
      await this.vouchersService.giftVoucherToUser(voucherId, user.id);
      selections.push({ referral_code_usage_id: usageId, voucher_id: voucherId });
    }

    await this.referralCodeUsageSelectionRepository.createBulk(selections);
    await this.referralCodeUsageRepository.updateSelectionStatus(
      usageId,
      ReferralCodeUsageSelectionStatusEnum.COMPLETED,
    );
  }

  async getMyUsages(user: User): Promise<Array<{
    id: number;
    referral_code: string;
    selection_mode: string;
    selection_status: string;
    selection_deadline: Date | null;
    created_at: Date;
    vouchers: Array<{
      id: number;
      code: string;
      discount_type: string;
      discount_value: number;
      description: string | null;
    }>;
  }>> {
    const usages = await this.referralCodeUsageRepository.findByUserId(user.id);
    const result = await Promise.all(
      usages.map(async (usage) => {
        const rc = await this.referralCodeRepository.findById(usage.referral_code_id);

        // Prefer selections table (audit trail) — fall back to rc.voucher_ids for legacy rows
        const selections = await this.referralCodeUsageSelectionRepository.findByUsageId(usage.id);
        const voucherIds = selections.length > 0
          ? selections.map((s) => s.voucher_id)
          : (rc?.voucher_ids ?? []);

        const vouchers = await Promise.all(
          voucherIds.map(async (vId) => {
            try {
              const v = await this.vouchersService.findById(vId);
              return {
                id: v.id,
                code: v.code,
                discount_type: v.discount_type,
                discount_value: Number(v.discount_value),
                description: v.description ?? null,
              };
            } catch {
              return null;
            }
          }),
        );
        return {
          id: usage.id,
          referral_code: rc?.code ?? '',
          selection_mode: rc?.selection_mode ?? '',
          selection_status: usage.selection_status,
          selection_deadline: usage.selection_deadline,
          created_at: usage.created_at,
          vouchers: vouchers.filter((v) => v !== null),
        };
      }),
    );
    return result.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

}
