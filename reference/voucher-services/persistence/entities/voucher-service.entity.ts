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
import { ServiceEntity } from '@/services/persistence/entities/service.entity';

@Entity({ name: 'voucher_services' })
@Index('IDX_voucher_services_voucher_id', ['voucher_id'])
@Index('IDX_voucher_services_service_id', ['service_id'])
@Index(
  'UQ_voucher_services_voucher_id_service_id',
  ['voucher_id', 'service_id'],
  {
    unique: true,
  },
)
export class VoucherServiceEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'int', nullable: false })
  voucher_id: number;
  @Column({ type: 'int', nullable: false })
  service_id: number;
  @ManyToOne(() => VoucherEntity, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'voucher_id' })
  voucher: VoucherEntity;
  @ManyToOne(() => ServiceEntity, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity;
  @CreateDateColumn()
  created_at: Date;
}
