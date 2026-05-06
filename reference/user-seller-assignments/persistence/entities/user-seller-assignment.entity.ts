import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserSellerAssignmentStatusEnum } from '@/statuses/user-seller-assignment-status.enum';

// Uniqueness is enforced via partial indexes in the DB (WHERE deleted_at IS NULL)
// so that soft-deleted records don't block re-assignment.
@Entity({ name: 'user_seller_assignments' })
@Index('idx_user_seller_assignments_seller_id', ['seller_id'])
export class UserSellerAssignmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  seller_id: number;

  @ManyToOne(() => SellerEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity;

  @Column({ type: 'int' })
  user_id: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({
    type: 'enum',
    enum: UserSellerAssignmentStatusEnum,
    default: UserSellerAssignmentStatusEnum.Active,
  })
  status: UserSellerAssignmentStatusEnum;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by: UserEntity | null;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
