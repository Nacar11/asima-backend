import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ContentTypeEnum } from '@/moderation/enums/content-type.enum';
import { ReportStatusEnum } from '@/moderation/enums/report-status.enum';

/**
 * ContentReport TypeORM entity.
 *
 * Represents the content_reports table. User reports of inappropriate content.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({
  name: 'content_reports',
})
@Index('IDX_content_reports_content_type', ['content_type'])
@Index('IDX_content_reports_content_id', ['content_id'])
@Index('IDX_content_reports_status', ['status'])
@Index('IDX_content_reports_content_type_id', ['content_type', 'content_id'])
export class ContentReportEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ContentTypeEnum,
    nullable: false,
  })
  content_type: ContentTypeEnum;

  @Column({ type: 'int', nullable: false })
  content_id: number;

  @Column({ type: 'int', nullable: false })
  reported_by: number;

  @ManyToOne(() => UserEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'reported_by' })
  reporter: UserEntity;

  @Column({ type: 'text', nullable: false })
  reason: string;

  @Column({ type: 'text', nullable: true })
  details: string | null;

  @Column({
    type: 'enum',
    enum: ReportStatusEnum,
    default: ReportStatusEnum.PENDING,
    nullable: false,
  })
  status: ReportStatusEnum;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
