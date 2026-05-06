import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { VoucherDiscountTypeEnum } from '@/vouchers/enums/voucher-discount-type.enum';
import { VoucherScopeEnum } from '@/vouchers/enums/voucher-scope.enum';
import { VoucherStatusEnum } from '@/vouchers/enums/voucher-status.enum';

@Entity({ name: 'vouchers' })
@Index('IDX_vouchers_code', ['code'])
@Index('IDX_vouchers_scope', ['scope'])
@Index('IDX_vouchers_seller_id', ['seller_id'])
@Index('IDX_vouchers_service_id', ['service_id'])
@Index('IDX_vouchers_status', ['status'])
@Index('IDX_vouchers_starts_at', ['starts_at'])
@Index('IDX_vouchers_expires_at', ['expires_at'])
@Index('IDX_vouchers_deleted_at', ['deleted_at'])
export class VoucherEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'varchar', length: 30, nullable: false })
  code: string;
  @Column({
    type: 'enum',
    enum: VoucherScopeEnum,
    default: VoucherScopeEnum.CATEGORIES,
    nullable: false,
  })
  scope: VoucherScopeEnum;
  @Column({ type: 'int', nullable: true })
  seller_id: number | null;
  @ManyToOne(() => SellerEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'seller_id' })
  seller?: SellerEntity | null;
  @Column({ type: 'int', nullable: true })
  service_id: number | null;
  @ManyToOne(() => ServiceEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'service_id' })
  service?: ServiceEntity | null;
  @Column({
    type: 'enum',
    enum: VoucherDiscountTypeEnum,
    nullable: false,
  })
  discount_type: VoucherDiscountTypeEnum;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  discount_value: number;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  max_discount_cap: number | null;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  min_order_amount: number;
  @Column({ type: 'int', nullable: true })
  total_limit: number | null;
  @Column({ type: 'int', nullable: true })
  per_user_limit: number | null;
  @Column({ type: 'int', default: 0, nullable: false })
  used_count: number;
  @Column({ type: 'timestamptz', nullable: true })
  starts_at: Date | null;
  @Column({ type: 'timestamptz', nullable: true })
  expires_at: Date | null;
  @Column({
    type: 'enum',
    enum: VoucherStatusEnum,
    default: VoucherStatusEnum.ACTIVE,
    nullable: false,
  })
  status: VoucherStatusEnum;
  @Column({ type: 'boolean', default: false, nullable: false })
  is_claimable: boolean;
  @Column({ type: 'int', array: true, nullable: true })
  allowed_user_ids: number[] | null;
  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;
  @Column({ type: 'text', nullable: true })
  terms_and_conditions: string | null;
  @Column({ type: 'boolean', nullable: true })
  include_addons_flag: boolean | null;
  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;
  @CreateDateColumn()
  created_at: Date;
  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;
  @UpdateDateColumn()
  updated_at: Date;
  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;
  @DeleteDateColumn()
  deleted_at?: Date | null;
}
