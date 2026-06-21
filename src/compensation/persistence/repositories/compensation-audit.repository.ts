import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  BaseCompensationAuditRepository,
  RecordCompensationAuditInput,
} from '@/compensation/persistence/base-compensation-audit.repository';
import { CompensationAuditEntity } from '@/compensation/persistence/entities/compensation-audit.entity';
import { CompensationAuditMapper } from '@/compensation/persistence/mappers/compensation-audit.mapper';
import { CompensationAudit } from '@/compensation/domain/compensation-audit';

@Injectable()
export class CompensationAuditRepository extends BaseCompensationAuditRepository {
  constructor(
    @InjectRepository(CompensationAuditEntity)
    private readonly repo: Repository<CompensationAuditEntity>,
  ) {
    super();
  }

  private repoFor(manager?: EntityManager): Repository<CompensationAuditEntity> {
    return manager ? manager.getRepository(CompensationAuditEntity) : this.repo;
  }

  async record(
    input: RecordCompensationAuditInput,
    manager?: EntityManager,
  ): Promise<CompensationAudit> {
    const repo = this.repoFor(manager);
    const entity = repo.create({
      compensation_id: input.compensation_id,
      employee_id: input.employee_id,
      action: input.action,
      before_monthly_salary: input.before_monthly_salary ?? null,
      after_monthly_salary: input.after_monthly_salary ?? null,
      before_hourly_rate: input.before_hourly_rate ?? null,
      after_hourly_rate: input.after_hourly_rate ?? null,
      before_effective_from: input.before_effective_from ?? null,
      after_effective_from: input.after_effective_from ?? null,
      actor_id: input.actor_id ?? null,
    });
    const saved = await repo.save(entity);
    return CompensationAuditMapper.toDomain(saved);
  }

  async findByCompensationId(compensation_id: number): Promise<CompensationAudit[]> {
    const entities = await this.repo
      .createQueryBuilder('a')
      // Opt the select:false money columns back in — this is an audit read.
      .addSelect([
        'a.before_monthly_salary',
        'a.after_monthly_salary',
        'a.before_hourly_rate',
        'a.after_hourly_rate',
      ])
      .where('a.compensation_id = :id', { id: compensation_id })
      .orderBy('a.created_at', 'DESC')
      .addOrderBy('a.id', 'DESC')
      .getMany();
    return entities.map(CompensationAuditMapper.toDomain);
  }
}
