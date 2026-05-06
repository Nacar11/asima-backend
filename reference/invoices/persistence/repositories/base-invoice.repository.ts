import { DataSource } from 'typeorm';
import { Invoice } from '../../domain/invoice';
import { FindAllInvoice } from '../../domain/find-all-invoice';
import { QueryInvoiceDto } from '../../dto/query-invoice.dto';

/**
 * Abstract base repository for Invoice
 */
export abstract class BaseInvoiceRepository {
  abstract create(data: Partial<Invoice>): Promise<Invoice>;
  abstract findAll(query: QueryInvoiceDto): Promise<FindAllInvoice>;
  abstract findById(id: number): Promise<Invoice | null>;
  abstract findByOrderId(orderId: number): Promise<Invoice | null>;
  abstract findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null>;
  abstract update(id: number, data: Partial<Invoice>): Promise<Invoice>;
  abstract generateInvoiceNumber(): Promise<string>;
  abstract getDataSource(): DataSource;
}
