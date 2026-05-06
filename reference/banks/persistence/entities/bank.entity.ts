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

/**
 * Bank TypeORM entity
 */
@Entity({
  name: 'banks',
})
@Index(['bank_code'])
@Index(['bank_name'])
@Index(['is_active'])
@Index(['display_order'])
export class BankEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: false })
  bank_code: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  bank_name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo_url: string | null;

  @Column({ type: 'boolean', default: true, nullable: false })
  is_active: boolean;

  @Column({ type: 'int', default: 0, nullable: false })
  display_order: number;

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
