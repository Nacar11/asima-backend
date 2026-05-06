import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { UserPermissionEntity } from '@/user-permissions/persistence/entities/user-permission.entity';
import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
  Unique,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { StatusEnum } from '@/user-groups/user-groups.enum';

@Entity({
  name: 'user_groups',
})
@Unique(['seller_id', 'group_name'])
export class UserGroupEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  @Index('idx_user_groups_seller_id')
  seller_id: number | null;

  @ManyToOne(() => SellerEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  group_name: string;

  @Column({
    type: 'varchar',
    length: 500,
  })
  description: string;

  @Column({
    type: 'enum',
    enum: StatusEnum,
    nullable: false,
    default: StatusEnum.ACTIVE,
  })
  status: string;

  @ManyToOne(() => UserEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => UserEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @DeleteDateColumn()
  deleted_at?: Date | null;

  // ---- Relations ---- //
  @OneToMany(
    () => UserPermissionEntity,
    (userPermission) => userPermission.group,
  )
  user_permissions: UserPermissionEntity[];

  @OneToMany(
    () => UserAssignmentEntity,
    (userAssignment) => userAssignment.group,
  )
  user_assignments: UserAssignmentEntity[];
}
