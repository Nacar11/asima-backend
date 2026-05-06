import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';

@Entity({ name: 'custom_payment_methods' })
export class CustomPaymentMethodEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  code: string | null;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_builtin: boolean;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  icon_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  qr_image_url: string | null;

  @Column({ type: 'boolean', default: true, nullable: false })
  is_enabled: boolean;

  @Column({ type: 'int', default: 100, nullable: false })
  sort_order: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at: Date | null;
}
