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
import {
  FileTypeEnum,
  RecordTypeEnum,
  StatusEnum,
} from '@/attachments/attachments.enum';

@Entity({
  name: 'attachments',
})
export class AttachmentsEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: RecordTypeEnum,
    nullable: false,
  })
  record_type: RecordTypeEnum;

  @Column({
    type: 'int',
    nullable: false,
  })
  record_id: number;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  file_name: string;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  file_path: string;

  @Column({
    type: 'enum',
    enum: FileTypeEnum,
    nullable: false,
  })
  file_type: FileTypeEnum;

  @Column({
    type: 'enum',
    enum: StatusEnum,
    nullable: false,
    default: StatusEnum.ACTIVE,
  })
  status: StatusEnum;

  @ManyToOne(() => UserEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => UserEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @DeleteDateColumn()
  deleted_at?: Date | null;
}
