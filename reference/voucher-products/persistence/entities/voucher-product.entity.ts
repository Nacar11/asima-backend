import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';

@Entity({ name: 'voucher_products' })
@Index('IDX_voucher_products_voucher_id', ['voucher_id'])
@Index('IDX_voucher_products_product_id', ['product_id'])
@Index(
  'UQ_voucher_products_voucher_id_product_id',
  ['voucher_id', 'product_id'],
  {
    unique: true,
  },
)
export class VoucherProductEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'int', nullable: false })
  voucher_id: number;
  @Column({ type: 'int', nullable: false })
  product_id: number;
  @ManyToOne(() => VoucherEntity, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'voucher_id' })
  voucher: VoucherEntity;
  @ManyToOne(() => ProductEntity, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;
  @CreateDateColumn()
  created_at: Date;
}
