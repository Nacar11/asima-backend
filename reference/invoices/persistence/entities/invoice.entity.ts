import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';

/**
 * Invoice entity for database persistence
 */
@Entity('invoices')
export class InvoiceEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  invoice_number: string;

  @Index('IDX_invoices_order_id')
  @Column({ type: 'int', unique: true })
  order_id: number;

  @Index('IDX_invoices_seller_id')
  @Column({ type: 'int' })
  seller_id: number;

  @Index('IDX_invoices_user_id')
  @Column({ type: 'int' })
  user_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  tax_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  shipping_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'varchar', length: 255 })
  seller_store_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  seller_business_registration?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  seller_tax_id?: string | null;

  @Column({ type: 'varchar', length: 255 })
  customer_name: string;

  @Column({ type: 'varchar', length: 100 })
  customer_email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  customer_phone?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  shipping_recipient_name?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  shipping_address_line1?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  shipping_address_line2?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  shipping_city?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  shipping_state_province?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  shipping_postal_code?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  shipping_country?: string | null;

  @Index('IDX_invoices_status')
  @Column({
    type: 'enum',
    enum: ['valid', 'voided'],
    default: 'valid',
  })
  status: 'valid' | 'voided';

  @Column({ type: 'varchar', length: 500, nullable: true })
  pdf_file_path?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  pdf_generated_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  email_sent_at?: Date | null;

  @Column({
    type: 'enum',
    enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
    default: 'pending',
  })
  email_status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';

  @Column({ type: 'int', default: 0 })
  email_retry_count: number;

  @Column({ type: 'timestamp', nullable: true })
  last_email_attempt_at?: Date | null;

  @Column({ type: 'int', nullable: true })
  created_by?: number | null;

  @Column({ type: 'int', nullable: true })
  updated_by?: number | null;

  @Index('IDX_invoices_created_at')
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => SalesOrderEntity)
  @JoinColumn({ name: 'order_id' })
  order?: SalesOrderEntity;

  @ManyToOne(() => SellerEntity)
  @JoinColumn({ name: 'seller_id' })
  seller?: SellerEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  created_by_user?: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updated_by' })
  updated_by_user?: UserEntity;
}
