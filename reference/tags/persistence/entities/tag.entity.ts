import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Entity({
  name: 'tags',
})
@Unique('UQ_tags_seller_id_name', ['seller_id', 'name'])
@Unique('UQ_tags_seller_id_slug', ['seller_id', 'slug'])
export class TagEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'bigint',
    nullable: true,
  })
  @Index()
  seller_id?: number | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  @Index()
  name: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  @Index()
  slug: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string | null;

  @Column({
    type: 'int',
    default: 0,
  })
  @Index()
  display_order: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'Active',
    nullable: false,
  })
  @Index()
  status: string;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updated_at: Date;

  @Column({
    type: 'bigint',
    nullable: true,
  })
  @Index()
  created_by?: number | null;

  @Column({
    type: 'bigint',
    nullable: true,
  })
  updated_by?: number | null;

  @Column({
    type: 'bigint',
    nullable: true,
  })
  deleted_by?: number | null;

  @DeleteDateColumn({
    type: 'timestamptz',
    nullable: true,
  })
  @Index()
  deleted_at?: Date | null;

  // Relations
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'seller_id' })
  seller?: UserEntity | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator?: UserEntity | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater?: UserEntity | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleter?: UserEntity | null;
}
