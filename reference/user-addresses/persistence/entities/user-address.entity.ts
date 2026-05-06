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

@Entity({
  name: 'user_addresses',
})
export class UserAddressEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_user_addresses_user_id')
  @Column({ type: 'integer', nullable: false })
  user_id: number;

  @ManyToOne(() => UserEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
  })
  user: UserEntity;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    default: 'Shipping',
  })
  label: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  recipient_name: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  phone: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  address_line1: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  address_line2: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  city: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  state_province: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
  })
  postal_code: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    default: 'Philippines',
  })
  country: string;

  @Index('idx_user_addresses_is_default')
  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  is_default: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by: UserEntity | null;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at: Date | null;
}
