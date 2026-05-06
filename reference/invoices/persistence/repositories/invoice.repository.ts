import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BaseInvoiceRepository } from './base-invoice.repository';
import { InvoiceEntity } from '../entities/invoice.entity';
import { InvoiceMapper } from '../mappers/invoice.mapper';
import { Invoice } from '../../domain/invoice';
import { FindAllInvoice } from '../../domain/find-all-invoice';
import { QueryInvoiceDto } from '../../dto/query-invoice.dto';

/**
 * Concrete implementation of Invoice repository
 */
@Injectable()
export class InvoiceRepository extends BaseInvoiceRepository {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepository: Repository<InvoiceEntity>,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async create(data: Partial<Invoice>): Promise<Invoice> {
    const entity = this.invoiceRepository.create(
      InvoiceMapper.toPersistence(data),
    );
    const saved = await this.invoiceRepository.save(entity);
    return InvoiceMapper.toDomain(saved);
  }

  async findAll(query: QueryInvoiceDto): Promise<FindAllInvoice> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;
    const sortOrder = query.sortBy || 'DESC';
    const qb = this.invoiceRepository
      .createQueryBuilder('invoice')
      .orderBy('invoice.created_at', sortOrder);
    if (query.start_date) {
      qb.andWhere('invoice.created_at >= :startDate', {
        startDate: query.start_date,
      });
    }
    if (query.end_date) {
      qb.andWhere('invoice.created_at <= :endDate', {
        endDate: query.end_date,
      });
    }
    if (query.seller_id) {
      qb.andWhere('invoice.seller_id = :sellerId', {
        sellerId: query.seller_id,
      });
    }
    if (query.min_amount !== undefined) {
      qb.andWhere('invoice.total_amount >= :minAmount', {
        minAmount: query.min_amount,
      });
    }
    if (query.max_amount !== undefined) {
      qb.andWhere('invoice.total_amount <= :maxAmount', {
        maxAmount: query.max_amount,
      });
    }
    if (query.search) {
      const sanitizedSearch = this.escapeSqlWildcards(query.search);
      qb.andWhere(
        '(invoice.invoice_number ILIKE :search OR invoice.order_id::text ILIKE :search)',
        { search: `%${sanitizedSearch}%` },
      );
    }
    if (query.user_id) {
      qb.andWhere('invoice.user_id = :userId', {
        userId: query.user_id,
      });
    }
    const [entities, totalCount] = await qb
      .skip(skip)
      .take(take)
      .getManyAndCount();
    return {
      data: entities.map(InvoiceMapper.toDomain),
      totalCount,
      skip,
      take,
    };
  }

  async findById(id: number): Promise<Invoice | null> {
    const entity = await this.invoiceRepository.findOne({
      where: { id },
    });
    return entity ? InvoiceMapper.toDomain(entity) : null;
  }

  async findByOrderId(orderId: number): Promise<Invoice | null> {
    const entity = await this.invoiceRepository.findOne({
      where: { order_id: orderId },
    });
    return entity ? InvoiceMapper.toDomain(entity) : null;
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    const entity = await this.invoiceRepository.findOne({
      where: { invoice_number: invoiceNumber },
    });
    return entity ? InvoiceMapper.toDomain(entity) : null;
  }

  async update(id: number, data: Partial<Invoice>): Promise<Invoice> {
    await this.invoiceRepository.update(id, InvoiceMapper.toPersistence(data));
    const updated = await this.invoiceRepository.findOne({ where: { id } });
    if (!updated) {
      throw new Error('Invoice not found after update');
    }
    return InvoiceMapper.toDomain(updated);
  }

  async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const result = await this.dataSource.query(
      `SELECT nextval('invoice_number_seq') as seq`,
    );
    const sequence = String(result[0].seq).padStart(5, '0');
    return `INV-${year}-${month}-${sequence}`;
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }

  private escapeSqlWildcards(input: string): string {
    return input.replace(/[%_\\]/g, '\\$&');
  }
}
