import {
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { StatusEnum } from '@/utils/enums/status-enum';

@Entity({
  name: 'department',
})
@Unique(['department_code'])
export class DepartmentEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'char',
    length: 2,
    unique: true,
    nullable: false,
  })
  department_code: string;

  @Column({
    type: String,
    length: 100,
    nullable: false,
  })
  department_name: string;

  @ManyToOne(() => UserEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'department_head' })
  department_head: UserEntity;

  @Column({
    type: 'enum',
    enum: StatusEnum,
    default: StatusEnum.ACTIVE,
    nullable: false,
  })
  status: StatusEnum;

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
