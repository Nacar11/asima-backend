import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISeedService } from '../seed.interface';
import { Repository, DataSource } from 'typeorm';
import { InvoiceEntity } from '@/invoices/persistence/entities/invoice.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';

/**
 * Service for seeding invoices based on completed sales orders
 */
@Injectable()
export class InvoiceSeedService implements ISeedService {
  constructor(
    @InjectRepository(InvoiceEntity)
    private invoiceRepository: Repository<InvoiceEntity>,
    @InjectRepository(SalesOrderEntity)
    private salesOrderRepository: Repository<SalesOrderEntity>,
    private dataSource: DataSource,
  ) {}

  async run(): Promise<void> {
    const count = await this.invoiceRepository.count();
    if (count > 0) {
      console.log(`⚠️  Invoices already seeded (${count} records). Skipping.`);
      return;
    }
    const completedOrders = await this.salesOrderRepository.find({
      where: { status: OrderStatusEnum.COMPLETED },
      relations: ['user', 'seller'],
    });
    if (completedOrders.length === 0) {
      console.log('⚠️  No completed orders found. Skipping invoice seed.');
      return;
    }
    console.log(
      `📄 Found ${completedOrders.length} completed orders. Creating invoices...`,
    );
    let createdCount = 0;
    for (const order of completedOrders) {
      const existingInvoice = await this.invoiceRepository.findOne({
        where: { order_id: order.id },
      });
      if (existingInvoice) {
        continue;
      }
      const invoiceNumber = await this.generateInvoiceNumber();
      const customerName = this.formatCustomerName(order.user);
      const invoice = this.invoiceRepository.create({
        invoice_number: invoiceNumber,
        order_id: order.id,
        seller_id: order.seller_id ?? 0,
        user_id: order.user_id,
        subtotal: Number(order.subtotal),
        tax_amount: Number(order.tax_amount),
        shipping_amount: Number(order.shipping_amount),
        total_amount: Number(order.total_amount),
        seller_store_name: order.seller?.store_name || 'N/A',
        seller_business_registration:
          order.seller?.business_registration_number || null,
        seller_tax_id: order.seller?.tax_id || null,
        customer_name: customerName,
        customer_email: order.user?.email || '',
        customer_phone: null,
        shipping_recipient_name: order.shipping_recipient_name || null,
        shipping_address_line1: order.shipping_address_line1 || null,
        shipping_address_line2: order.shipping_address_line2 || null,
        shipping_city: order.shipping_city || null,
        shipping_state_province: order.shipping_state_province || null,
        shipping_postal_code: order.shipping_postal_code || null,
        shipping_country: order.shipping_country || null,
        status: 'valid',
        email_status: 'pending',
        email_retry_count: 0,
        created_by: order.user_id,
        updated_by: order.user_id,
      });
      await this.invoiceRepository.save(invoice);
      createdCount++;
    }
    console.log(`✅ Created ${createdCount} invoices successfully.`);
  }

  private async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const result = await this.dataSource.query(
      `SELECT nextval('invoice_number_seq') as seq`,
    );
    const sequence = String(result[0].seq).padStart(5, '0');
    return `INV-${year}-${month}-${sequence}`;
  }

  private formatCustomerName(
    user: { first_name?: string; last_name?: string } | null,
  ): string {
    if (!user) return 'N/A';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'N/A';
  }
}
