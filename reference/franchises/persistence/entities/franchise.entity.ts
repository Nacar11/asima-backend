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
import { FranchiseStatusEnum } from '@/franchises/domain/franchise-status.enum';

/**
 * Franchise TypeORM entity
 */
@Entity({ name: 'franchises' })
@Index(['name'])
@Index(['email'])
@Index(['status'])
@Index(['deleted_at'])
@Index(['onboarded_at'])
export class FranchiseEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  owner_name: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  address_line1: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address_line2: string | null;

  @Column({ type: 'varchar', length: 100, nullable: false })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  state_province: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  postal_code: string;

  @Column({ type: 'varchar', length: 100, default: 'Philippines' })
  country: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: FranchiseStatusEnum.SCREENING,
  })
  status: FranchiseStatusEnum;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamp', nullable: true })
  onboarded_at: Date | null;

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
  deleted_by: UserEntity | null;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
