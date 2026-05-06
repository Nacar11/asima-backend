import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { CostCenterEntity } from '@/cost-centers/persistence/entities/cost-center.entity';
import { StatusEnum, UserSuffixEnum } from '@/users/users.enum';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { UserDetailEntity } from '@/user-details/persistence/entities/user-detail.entity';
import { UserSecurityEntity } from '@/user-security/persistence/entities/user-security.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';

@Entity({
  name: 'user',
})
export class UserEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: String, length: 50, nullable: false })
  user_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  device_pin: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  salt: string | null;

  @Index()
  @Column({ type: String, length: 100, nullable: false })
  first_name: string;

  @Index()
  @Column({ type: String, length: 100, nullable: true })
  middle_name?: string | null;

  @Index()
  @Column({ type: String, length: 100, nullable: false })
  last_name: string;

  @Column({ type: 'enum', enum: UserSuffixEnum, nullable: true })
  suffix?: UserSuffixEnum | null;

  @ManyToOne(() => CostCenterEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'cost_center',
    referencedColumnName: 'id',
  })
  cost_center: CostCenterEntity | null;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  email: string;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_guest: boolean;

  @Column({
    type: 'boolean',
    default: false,
    nullable: false,
  })
  email_verified: boolean;

  @Index('idx_user_phone')
  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  phone: string | null;

  @Column({
    type: 'boolean',
    default: false,
    nullable: false,
  })
  phone_verified: boolean;

  @Column({
    type: 'boolean',
    default: false,
    nullable: false,
  })
  must_change_password: boolean;

  @Column({
    type: 'boolean',
    nullable: false,
  })
  system_admin: boolean;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  image: string | null;

  @Column({
    type: 'enum',
    nullable: false,
    enum: StatusEnum,
    default: StatusEnum.ACTIVE,
  })
  status: StatusEnum;

  // Define the relation
  @OneToMany(
    () => UserAssignmentEntity,
    (userAssignment) => userAssignment.user,
  )
  assignments: UserAssignmentEntity[] | null;

  // One-to-one relationship with user details
  @OneToOne(() => UserDetailEntity, (details) => details.user, {
    nullable: true,
  })
  details?: UserDetailEntity | null;

  // One-to-one relationship with user security
  @OneToOne(() => UserSecurityEntity, (security) => security.user, {
    nullable: true,
  })
  security?: UserSecurityEntity | null;

  // One-to-one relationship with seller
  @OneToOne(() => SellerEntity, (seller) => seller.user, {
    nullable: true,
  })
  @JoinColumn({ name: 'id', referencedColumnName: 'user_id' })
  seller?: SellerEntity | null;

  @ManyToOne(() => UserAddressEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'default_address_id' })
  default_address?: UserAddressEntity | null;

  @Column({ type: 'integer', nullable: true })
  preferred_currency_id?: number | null;

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
