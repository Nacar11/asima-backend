import {
  Invoice,
  InvoiceStatusEnum,
  InvoiceEmailStatusEnum,
} from '../../domain/invoice';
import { InvoiceEntity } from '../entities/invoice.entity';

/**
 * Mapper for converting between Invoice domain and entity
 */
export class InvoiceMapper {
  /**
   * Convert entity to domain
   */
  static toDomain(entity: InvoiceEntity): Invoice {
    const domain = new Invoice();
    domain.id = entity.id;
    domain.invoice_number = entity.invoice_number;
    domain.order_id = entity.order_id;
    domain.seller_id = entity.seller_id;
    domain.user_id = entity.user_id;
    domain.subtotal = Number(entity.subtotal);
    domain.tax_amount = Number(entity.tax_amount);
    domain.shipping_amount = Number(entity.shipping_amount);
    domain.total_amount = Number(entity.total_amount);
    domain.seller_store_name = entity.seller_store_name;
    domain.seller_business_registration = entity.seller_business_registration;
    domain.seller_tax_id = entity.seller_tax_id;
    domain.customer_name = entity.customer_name;
    domain.customer_email = entity.customer_email;
    domain.customer_phone = entity.customer_phone;
    domain.shipping_recipient_name = entity.shipping_recipient_name;
    domain.shipping_address_line1 = entity.shipping_address_line1;
    domain.shipping_address_line2 = entity.shipping_address_line2;
    domain.shipping_city = entity.shipping_city;
    domain.shipping_state_province = entity.shipping_state_province;
    domain.shipping_postal_code = entity.shipping_postal_code;
    domain.shipping_country = entity.shipping_country;
    domain.status = entity.status as InvoiceStatusEnum;
    domain.pdf_file_path = entity.pdf_file_path;
    domain.pdf_generated_at = entity.pdf_generated_at;
    domain.email_sent_at = entity.email_sent_at;
    domain.email_status = entity.email_status as InvoiceEmailStatusEnum;
    domain.email_retry_count = entity.email_retry_count;
    domain.last_email_attempt_at = entity.last_email_attempt_at;
    domain.created_by = entity.created_by;
    domain.updated_by = entity.updated_by;
    domain.created_at = entity.created_at;
    domain.updated_at = entity.updated_at;
    return domain;
  }

  /**
   * Convert domain to persistence entity
   */
  static toPersistence(domain: Partial<Invoice>): Partial<InvoiceEntity> {
    const entity: Partial<InvoiceEntity> = {};
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.invoice_number !== undefined) {
      entity.invoice_number = domain.invoice_number;
    }
    if (domain.order_id !== undefined) entity.order_id = domain.order_id;
    if (domain.seller_id !== undefined) entity.seller_id = domain.seller_id;
    if (domain.user_id !== undefined) entity.user_id = domain.user_id;
    if (domain.subtotal !== undefined) entity.subtotal = domain.subtotal;
    if (domain.tax_amount !== undefined) entity.tax_amount = domain.tax_amount;
    if (domain.shipping_amount !== undefined) {
      entity.shipping_amount = domain.shipping_amount;
    }
    if (domain.total_amount !== undefined) {
      entity.total_amount = domain.total_amount;
    }
    if (domain.seller_store_name !== undefined) {
      entity.seller_store_name = domain.seller_store_name;
    }
    if (domain.seller_business_registration !== undefined) {
      entity.seller_business_registration = domain.seller_business_registration;
    }
    if (domain.seller_tax_id !== undefined) {
      entity.seller_tax_id = domain.seller_tax_id;
    }
    if (domain.customer_name !== undefined) {
      entity.customer_name = domain.customer_name;
    }
    if (domain.customer_email !== undefined) {
      entity.customer_email = domain.customer_email;
    }
    if (domain.customer_phone !== undefined) {
      entity.customer_phone = domain.customer_phone;
    }
    if (domain.shipping_recipient_name !== undefined) {
      entity.shipping_recipient_name = domain.shipping_recipient_name;
    }
    if (domain.shipping_address_line1 !== undefined) {
      entity.shipping_address_line1 = domain.shipping_address_line1;
    }
    if (domain.shipping_address_line2 !== undefined) {
      entity.shipping_address_line2 = domain.shipping_address_line2;
    }
    if (domain.shipping_city !== undefined) {
      entity.shipping_city = domain.shipping_city;
    }
    if (domain.shipping_state_province !== undefined) {
      entity.shipping_state_province = domain.shipping_state_province;
    }
    if (domain.shipping_postal_code !== undefined) {
      entity.shipping_postal_code = domain.shipping_postal_code;
    }
    if (domain.shipping_country !== undefined) {
      entity.shipping_country = domain.shipping_country;
    }
    if (domain.status !== undefined) entity.status = domain.status;
    if (domain.pdf_file_path !== undefined) {
      entity.pdf_file_path = domain.pdf_file_path;
    }
    if (domain.pdf_generated_at !== undefined) {
      entity.pdf_generated_at = domain.pdf_generated_at;
    }
    if (domain.email_sent_at !== undefined) {
      entity.email_sent_at = domain.email_sent_at;
    }
    if (domain.email_status !== undefined) {
      entity.email_status = domain.email_status;
    }
    if (domain.email_retry_count !== undefined) {
      entity.email_retry_count = domain.email_retry_count;
    }
    if (domain.last_email_attempt_at !== undefined) {
      entity.last_email_attempt_at = domain.last_email_attempt_at;
    }
    if (domain.created_by !== undefined) entity.created_by = domain.created_by;
    if (domain.updated_by !== undefined) entity.updated_by = domain.updated_by;
    return entity;
  }
}
