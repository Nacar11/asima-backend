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
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { FranchiseEntity } from './franchise.entity';
import { FranchiseStatusEnum } from '@/franchises/domain/franchise-status.enum';

/**
 * Franchise Status Event TypeORM entity
 * Stores immutable audit trail of all franchise status changes
 */
@Entity({ name: 'franchise_status_events' })
@Index(['franchise_id'])
@Index(['created_at'])
@Index(['franchise_id', 'created_at'])
export class FranchiseStatusEventEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  franchise_id: number;

  @ManyToOne(() => FranchiseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'franchise_id' })
  franchise: FranchiseEntity;

  @Column({ type: 'varchar', length: 20, nullable: true })
  previous_status: FranchiseStatusEnum | null;

  @Column({ type: 'varchar', length: 20, nullable: false })
  new_status: FranchiseStatusEnum;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn()
  created_at: Date;
}
