import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'maya_webhook_events' })
@Index('IDX_maya_webhook_events_provider_event_id', ['provider_event_id'], {
  unique: true,
})
@Index('IDX_maya_webhook_events_txnid', ['txnid'])
@Index('IDX_maya_webhook_events_status', ['status'])
export class MayaWebhookEventEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 191, nullable: false })
  provider_event_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  event_type: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  txnid: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  signature: string | null;

  @Column({ type: 'jsonb', nullable: false })
  payload: Record<string, any>;

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'pending' })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @Column({ type: 'int', nullable: false, default: 0 })
  retry_count: number;

  @Column({ type: 'timestamptz', nullable: true })
  next_retry_at: Date | null;

  @Column({ type: 'int', nullable: false, default: 0 })
  duplicate_count: number;

  @Column({ type: 'timestamptz', nullable: true })
  last_duplicate_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  processing_started_at: Date | null;

  @Column({ type: 'int', nullable: true })
  processing_latency_ms: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  processed_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
