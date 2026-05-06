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
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';

/**
 * Seller Certification TypeORM entity
 */
@Entity({
  name: 'seller_certifications',
})
@Index(['seller_id'])
@Index(['status'])
export class SellerCertificationEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  seller_id: number;

  @ManyToOne(() => SellerEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  issuer: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  credential_id: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  credential_url: string | null;

  @Column({ type: 'date', nullable: true })
  issue_date: Date | null;

  @Column({ type: 'date', nullable: true })
  expiry_date: Date | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'Active',
    nullable: false,
  })
  status: string;

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
