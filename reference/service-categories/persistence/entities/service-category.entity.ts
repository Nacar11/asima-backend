import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Entity({ name: 'service_categories' })
@Index(['code'], { unique: true })
@Index(['is_active'])
@Index(['is_featured'])
@Index(['status'])
export class ServiceCategoryEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  parent_id: number | null;

  @ManyToOne(() => ServiceCategoryEntity, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: ServiceCategoryEntity | null;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  icon_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url: string | null;

  @Column({ type: 'int', default: 0, nullable: false })
  level: number;

  @Column({ type: 'int', default: 0, nullable: false })
  display_order: number;

  @Column({ type: 'boolean', default: true, nullable: false })
  is_active: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_featured: boolean;

  @Column({ type: 'varchar', length: 20, default: 'Active', nullable: false })
  status: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 10,
    nullable: false,
  })
  default_platform_fee_percent: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  meta_title: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  meta_description: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null;
}
