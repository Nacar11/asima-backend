import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { PickleballMerchantApplicationEntity } from '@/pickleball-merchants/persistence/entities/pickleball-merchant-application.entity';

@Entity({ name: 'pickleball_merchant_application_courts' })
@Index(['application_id'])
@Index(['display_order'])
export class PickleballMerchantApplicationCourtEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  application_id: number;

  @ManyToOne(
    () => PickleballMerchantApplicationEntity,
    (application) => application.courts,
    { nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'application_id' })
  application: PickleballMerchantApplicationEntity;

  @Column({ type: 'varchar', length: 120, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: false,
    default: 200,
  })
  hourly_rate: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  display_order: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
