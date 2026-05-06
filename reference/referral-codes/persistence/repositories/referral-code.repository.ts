import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { NullableType } from '@/utils/types/nullable.type';
import { ReferralCode } from '@/referral-codes/domain/referral-code';
import { ReferralCodeEntity } from '@/referral-codes/persistence/entities/referral-code.entity';
import { ReferralCodeVoucherEntity } from '@/referral-codes/persistence/entities/referral-code-voucher.entity';
import { ReferralCodeMapper } from '@/referral-codes/persistence/mappers/referral-code.mapper';
import { BaseReferralCodeRepository } from '@/referral-codes/persistence/base-referral-code.repository';
import { QueryReferralCodeDto } from '@/referral-codes/dto/query-referral-code.dto';

@Injectable()
export class ReferralCodeRepository extends BaseReferralCodeRepository {
  constructor(
    @InjectRepository(ReferralCodeEntity)
    private readonly repo: Repository<ReferralCodeEntity>,
    @InjectRepository(ReferralCodeVoucherEntity)
    private readonly voucherLinkRepo: Repository<ReferralCodeVoucherEntity>,
  ) {
    super();
  }

  async findAll(
    query: QueryReferralCodeDto,
  ): Promise<{ data: ReferralCode[]; total: number }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const qb = this.repo
      .createQueryBuilder('rc')
      .leftJoinAndSelect('rc.vouchers', 'vouchers')
      .where('rc.deleted_at IS NULL');

    if (query.status) {
      qb.andWhere('rc.status = :status', { status: query.status });
    }
    if (query.search) {
      qb.andWhere('(rc.code ILIKE :search OR rc.description ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [entities, total] = await qb
      .orderBy('rc.created_at', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { data: entities.map(ReferralCodeMapper.toDomain), total };
  }

  async findById(
    id: number,
    queryRunner?: QueryRunner,
  ): Promise<NullableType<ReferralCode>> {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(ReferralCodeEntity)
      : this.repo;

    const entity = await repo.findOne({
      where: { id },
      relations: ['vouchers'],
      withDeleted: false,
    });

    return entity ? ReferralCodeMapper.toDomain(entity) : null;
  }

  async findByCode(
    code: string,
    queryRunner?: QueryRunner,
  ): Promise<NullableType<ReferralCode>> {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(ReferralCodeEntity)
      : this.repo;

    const entity = await repo.findOne({
      where: { code },
      relations: ['vouchers'],
      withDeleted: false,
    });

    return entity ? ReferralCodeMapper.toDomain(entity) : null;
  }

  async create(
    data: Omit<ReferralCode, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'isValid' | 'voucher_ids'>,
    queryRunner?: QueryRunner,
  ): Promise<ReferralCode> {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(ReferralCodeEntity)
      : this.repo;

    const entity = repo.create(ReferralCodeMapper.toPersistence(data));
    const saved = await repo.save(entity);

    return this.findById(saved.id) as Promise<ReferralCode>;
  }

  async update(
    id: number,
    data: Partial<ReferralCode>,
    queryRunner?: QueryRunner,
  ): Promise<ReferralCode> {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(ReferralCodeEntity)
      : this.repo;

    await repo.update(id, ReferralCodeMapper.toPersistence(data));
    return this.findById(id) as Promise<ReferralCode>;
  }

  async softDelete(id: number, queryRunner?: QueryRunner): Promise<void> {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(ReferralCodeEntity)
      : this.repo;

    await repo.softDelete(id);
  }

  async incrementUsage(id: number, queryRunner?: QueryRunner): Promise<void> {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(ReferralCodeEntity)
      : this.repo;

    await repo
      .createQueryBuilder()
      .update(ReferralCodeEntity)
      .set({ usage_count: () => 'usage_count + 1' })
      .where('id = :id', { id })
      .useTransaction(!!queryRunner)
      .execute();
  }

  async saveVoucherLinks(
    referralCodeId: number,
    voucherIds: number[],
    queryRunner?: QueryRunner,
  ): Promise<void> {
    if (voucherIds.length === 0) return;

    const repo = queryRunner
      ? queryRunner.manager.getRepository(ReferralCodeVoucherEntity)
      : this.voucherLinkRepo;

    const links = voucherIds.map((voucherId) =>
      repo.create({ referral_code_id: referralCodeId, voucher_id: voucherId }),
    );
    await repo.save(links);
  }

  async replaceVoucherLinks(
    referralCodeId: number,
    voucherIds: number[],
  ): Promise<void> {
    await this.voucherLinkRepo.delete({ referral_code_id: referralCodeId });
    if (voucherIds.length > 0) {
      const links = voucherIds.map((voucherId) =>
        this.voucherLinkRepo.create({ referral_code_id: referralCodeId, voucher_id: voucherId }),
      );
      await this.voucherLinkRepo.save(links);
    }
  }
}
