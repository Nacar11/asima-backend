import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/users/domain/user';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { CreateMembershipVoucherConfigurationDto } from '@/membership-voucher-configurations/dto/create-membership-voucher-configuration.dto';
import { UpdateMembershipVoucherConfigurationDto } from '@/membership-voucher-configurations/dto/update-membership-voucher-configuration.dto';
import { QueryMembershipVoucherConfigurationDto } from '@/membership-voucher-configurations/dto/query-membership-voucher-configuration.dto';
import { MembershipVoucherConfiguration } from '@/membership-voucher-configurations/domain/membership-voucher-configuration';
import { FindAllMembershipVoucherConfiguration } from '@/membership-voucher-configurations/domain/find-all-membership-voucher-configuration';
import { BaseMembershipVoucherConfigurationRepository } from '@/membership-voucher-configurations/persistence/base-membership-voucher-configuration.repository';

/**
 * Membership voucher configuration service.
 */
@Injectable()
export class MembershipVoucherConfigurationsService {
  constructor(
    private readonly repository: BaseMembershipVoucherConfigurationRepository,
    @InjectRepository(VoucherEntity)
    private readonly voucherRepository: Repository<VoucherEntity>,
  ) {}

  /**
   * Create membership voucher configuration.
   */
  public async create(
    input: CreateMembershipVoucherConfigurationDto,
    causer: User,
  ): Promise<MembershipVoucherConfiguration> {
    await this.ensureVoucherExists(input.voucher_id);
    return this.repository.create({
      membership_plan_id: input.membership_plan_id,
      voucher_id: input.voucher_id,
      quantity: input.quantity ?? 1,
      is_active: input.is_active ?? true,
      created_by: causer,
      updated_by: causer,
      deleted_by: null,
      deleted_at: null,
      voucher_code: null,
    });
  }

  /**
   * List membership voucher configurations.
   */
  public async findAll(
    query: QueryMembershipVoucherConfigurationDto,
  ): Promise<FindAllMembershipVoucherConfiguration> {
    return this.repository.findAll(query);
  }

  /**
   * Find membership voucher configuration by id.
   */
  public async findById(id: number): Promise<MembershipVoucherConfiguration> {
    const membershipVoucherConfiguration: MembershipVoucherConfiguration | null =
      await this.repository.findById(id);
    if (!membershipVoucherConfiguration) {
      throw new NotFoundException(
        'Membership voucher configuration does not exist.',
      );
    }
    return membershipVoucherConfiguration;
  }

  /**
   * Update membership voucher configuration.
   */
  public async update(
    id: number,
    input: UpdateMembershipVoucherConfigurationDto,
    causer: User,
  ): Promise<MembershipVoucherConfiguration> {
    const existing: MembershipVoucherConfiguration = await this.findById(id);
    if (input.voucher_id !== undefined) {
      await this.ensureVoucherExists(input.voucher_id);
    }
    return this.repository.update(id, {
      membership_plan_id:
        input.membership_plan_id ?? existing.membership_plan_id,
      voucher_id: input.voucher_id ?? existing.voucher_id,
      quantity: input.quantity ?? existing.quantity,
      is_active: input.is_active ?? existing.is_active,
      updated_by: causer,
    });
  }

  /**
   * Delete membership voucher configuration.
   */
  public async remove(id: number, causer: User): Promise<void> {
    await this.findById(id);
    await this.repository.remove(id, causer);
  }

  private async ensureVoucherExists(voucherId: number): Promise<void> {
    const voucher: VoucherEntity | null = await this.voucherRepository.findOne({
      where: { id: voucherId },
    });
    if (!voucher) {
      throw new BadRequestException('Voucher does not exist.');
    }
    if (voucher.seller_id !== null) {
      throw new BadRequestException('Voucher must be an admin voucher.');
    }
  }
}
