import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Entity({ name: 'currencies' })
@Unique(['code'])
@Index('IDX_currencies_status', ['status'])
@Index('IDX_currencies_deleted_at', ['deleted_at'])
export class CurrencyEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('IDX_currencies_code')
  @Column({
    type: 'varchar',
    length: 3,
    nullable: false,
  })
  code: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  symbol: string | null;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 6,
    default: 1,
    nullable: false,
  })
  exchange_rate_to_php: number;

  @Column({ type: 'varchar', length: 20, default: 'Active', nullable: false })
  status: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date | null;
}
