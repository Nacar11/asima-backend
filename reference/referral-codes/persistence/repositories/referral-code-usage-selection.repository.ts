import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { ReferralCodeUsageSelection } from '@/referral-codes/domain/referral-code-usage-selection';
import { ReferralCodeUsageSelectionEntity } from '@/referral-codes/persistence/entities/referral-code-usage-selection.entity';
import { ReferralCodeUsageSelectionMapper } from '@/referral-codes/persistence/mappers/referral-code-usage-selection.mapper';
import { BaseReferralCodeUsageSelectionRepository } from '@/referral-codes/persistence/base-referral-code-usage-selection.repository';

@Injectable()
export class ReferralCodeUsageSelectionRepository extends BaseReferralCodeUsageSelectionRepository {
  constructor(
    @InjectRepository(ReferralCodeUsageSelectionEntity)
    private readonly repo: Repository<ReferralCodeUsageSelectionEntity>,
  ) {
    super();
  }

  async createBulk(
    selections: Array<Pick<ReferralCodeUsageSelection, 'referral_code_usage_id' | 'voucher_id'>>,
    queryRunner?: QueryRunner,
  ): Promise<void> {
    if (selections.length === 0) return;

    const repo = queryRunner
      ? queryRunner.manager.getRepository(ReferralCodeUsageSelectionEntity)
      : this.repo;

    const entities = selections.map((s) =>
      repo.create(ReferralCodeUsageSelectionMapper.toPersistence(s)),
    );
    await repo.save(entities);
  }

  async findByUsageId(usageId: number): Promise<ReferralCodeUsageSelection[]> {
    const entities = await this.repo.find({
      where: { referral_code_usage_id: usageId },
      order: { selected_at: 'ASC' },
    });
    return entities.map(ReferralCodeUsageSelectionMapper.toDomain);
  }
}
