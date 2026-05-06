import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { MenuEntity } from '@/menus/persistence/entities/menu.entity';
import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { StatusEnum } from '@/user-permissions/user-permissions.enum';

@Entity({
  name: 'user_permissions',
})
export class UserPermissionEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserGroupEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'group_id', referencedColumnName: 'id' })
  group: UserGroupEntity;

  @ManyToOne(() => MenuEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'menu_id', referencedColumnName: 'id' })
  menu: MenuEntity;

  @Column({
    type: 'text',
    array: true,
  })
  permissions: string[];

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
}
