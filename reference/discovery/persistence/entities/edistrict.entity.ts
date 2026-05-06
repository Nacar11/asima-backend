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

@Entity({ name: 'edistricts' })
@Index(['key'], { unique: true })
@Index(['status'])
@Index(['display_order'])
@Index(['seller_id'])
export class EdistrictEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  key: string;

  @Column({ type: 'varchar', length: 120, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  subtitle: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  store_name: string | null;

  @Column({ type: 'int', nullable: true })
  seller_id: number | null;

  @ManyToOne(() => SellerEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  background_image_url: string | null;

  @Column({ type: 'varchar', length: 32, nullable: false, default: 'active' })
  status: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  is_members_only: boolean;

  @Column({ type: 'int', nullable: false, default: 0 })
  display_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at?: Date | null;
}
