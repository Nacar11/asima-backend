import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseSalesOrderQuotationSnapshotRepository } from '@/sales-order-quotation-snapshots/persistence/base-sales-order-quotation-snapshot.repository';
import { SalesOrderQuotationSnapshotEntity } from '@/sales-order-quotation-snapshots/persistence/entities/sales-order-quotation-snapshot.entity';
import { SalesOrderQuotationSnapshotMapper } from '@/sales-order-quotation-snapshots/persistence/mappers/sales-order-quotation-snapshot.mapper';
import { SalesOrderQuotationSnapshot } from '@/sales-order-quotation-snapshots/domain/sales-order-quotation-snapshot';

@Injectable()
export class SalesOrderQuotationSnapshotRepository
  implements BaseSalesOrderQuotationSnapshotRepository
{
  constructor(
    @InjectRepository(SalesOrderQuotationSnapshotEntity)
    private readonly repository: Repository<SalesOrderQuotationSnapshotEntity>,
  ) {}

  async create(
    data: Omit<
      SalesOrderQuotationSnapshot,
      'id' | 'created_at' | 'updated_at' | 'deleted_at'
    >,
  ): Promise<SalesOrderQuotationSnapshot> {
    const entity = this.repository.create(
      SalesOrderQuotationSnapshotMapper.toEntity(data),
    );
    const saved = await this.repository.save(entity);
    return SalesOrderQuotationSnapshotMapper.toDomain(saved);
  }

  async createMany(
    data: Omit<
      SalesOrderQuotationSnapshot,
      'id' | 'created_at' | 'updated_at' | 'deleted_at'
    >[],
  ): Promise<SalesOrderQuotationSnapshot[]> {
    const entities = data.map((item) =>
      this.repository.create(SalesOrderQuotationSnapshotMapper.toEntity(item)),
    );
    const saved = await this.repository.save(entities);
    return saved.map((e) => SalesOrderQuotationSnapshotMapper.toDomain(e));
  }

  async findById(id: number): Promise<SalesOrderQuotationSnapshot | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });
    return entity ? SalesOrderQuotationSnapshotMapper.toDomain(entity) : null;
  }

  async findBySalesOrderId(
    salesOrderId: number,
  ): Promise<SalesOrderQuotationSnapshot[]> {
    const entities = await this.repository.find({
      where: { sales_order_id: salesOrderId },
      order: { sequence_order: 'ASC', id: 'ASC' },
    });
    return entities.map((e) => SalesOrderQuotationSnapshotMapper.toDomain(e));
  }

  async findBySalesOrderItemId(
    salesOrderItemId: number,
  ): Promise<SalesOrderQuotationSnapshot[]> {
    const entities = await this.repository.find({
      where: { sales_order_item_id: salesOrderItemId },
      order: { sequence_order: 'ASC', id: 'ASC' },
    });
    return entities.map((e) => SalesOrderQuotationSnapshotMapper.toDomain(e));
  }

  async findBySourceQuotationId(
    quotationId: number,
  ): Promise<SalesOrderQuotationSnapshot[]> {
    const entities = await this.repository.find({
      where: { source_quotation_id: quotationId },
      order: { sequence_order: 'ASC', id: 'ASC' },
    });
    return entities.map((e) => SalesOrderQuotationSnapshotMapper.toDomain(e));
  }
}
