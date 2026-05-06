import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, QueryRunner, Repository } from 'typeorm';
import { NullableType } from '@/utils/types/nullable.type';
import { ReferralCodeUsage } from '@/referral-codes/domain/referral-code-usage';
import { ReferralCodeUsageEntity } from '@/referral-codes/persistence/entities/referral-code-usage.entity';
import { ReferralCodeUsageMapper } from '@/referral-codes/persistence/mappers/referral-code-usage.mapper';
import { BaseReferralCodeUsageRepository } from '@/referral-codes/persistence/base-referral-code-usage.repository';
import { ReferralCodeUsageSelectionStatusEnum } from '@/referral-codes/enums/referral-code-usage-selection-status.enum';

@Injectable()
export class ReferralCodeUsageRepository extends BaseReferralCodeUsageRepository {
  constructor(
    @InjectRepository(ReferralCodeUsageEntity)
    private readonly repo: Repository<ReferralCodeUsageEntity>,
  ) {
    super();
  }

  async findById(
    id: number,
    queryRunner?: QueryRunner,
  ): Promise<NullableType<ReferralCodeUsage>> {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(ReferralCodeUsageEntity)
      : this.repo;

    const entity = await repo.findOne({ where: { id } });
    return entity ? ReferralCodeUsageMapper.toDomain(entity) : null;
  }

  async findByUserId(userId: number): Promise<ReferralCodeUsage[]> {
    const entities = await this.repo.find({ where: { user_id: userId } });
    return entities.map(ReferralCodeUsageMapper.toDomain);
  }

  async findByReferralCodeId(
    referralCodeId: number,
    skip: number,
    take: number,
  ): Promise<{ data: ReferralCodeUsage[]; total: number }> {
    const [entities, total] = await this.repo.findAndCount({
      where: { referral_code_id: referralCodeId },
      order: { created_at: 'DESC' },
      relations: ['user'],
      skip,
      take,
    });
    return { data: entities.map(ReferralCodeUsageMapper.toDomain), total };
  }

  async findOverdueSelections(now: Date): Promise<ReferralCodeUsage[]> {
    const entities = await this.repo.find({
      where: {
        selection_status: ReferralCodeUsageSelectionStatusEnum.PENDING,
        selection_deadline: LessThanOrEqual(now),
      },
    });
    return entities.map(ReferralCodeUsageMapper.toDomain);
  }

  async create(
    data: Omit<ReferralCodeUsage, 'id' | 'created_at'>,
    queryRunner?: QueryRunner,
  ): Promise<ReferralCodeUsage> {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(ReferralCodeUsageEntity)
      : this.repo;

    const entity = repo.create(ReferralCodeUsageMapper.toPersistence(data));
    const saved = await repo.save(entity);
    return ReferralCodeUsageMapper.toDomain(saved);
  }

  async updateSelectionStatus(
    id: number,
    status: ReferralCodeUsageSelectionStatusEnum,
    queryRunner?: QueryRunner,
  ): Promise<void> {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(ReferralCodeUsageEntity)
      : this.repo;

    await repo.update(id, { selection_status: status });
  }
}
