import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { StatusEnum } from '@/utils/enums/status-enum';

@Entity({
  name: 'division',
})
@Unique(['division_code'])
export class DivisionEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'char',
    length: 2,
    unique: true,
    nullable: false,
  })
  division_code: string;

  @Column({
    type: String,
    length: 100,
    nullable: false,
  })
  division_name: string;

  @ManyToOne(() => UserEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'division_head' })
  division_head: UserEntity;

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
