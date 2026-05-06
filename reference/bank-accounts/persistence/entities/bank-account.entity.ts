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
import { BankEntity } from '@/banks/persistence/entities/bank.entity';

/**
 * Bank Account TypeORM entity
 */
@Entity({
  name: 'bank_accounts',
})
@Index(['user_id'])
@Index(['bank_id'])
@Index(['is_default'])
@Index(['status'])
export class BankAccountEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  user_id: number;

  @Column({ type: 'int', nullable: false })
  bank_id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  account_holder_name: string;

  @Column({ type: 'text', nullable: false })
  account_number_encrypted: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  last_four: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  account_type: string | null;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_default: boolean;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'unverified',
    nullable: false,
  })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  verified_at?: Date | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => BankEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'bank_id' })
  bank: BankEntity;

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
