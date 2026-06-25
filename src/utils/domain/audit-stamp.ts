import { ValueObject } from '@/utils/domain/value-object';

export type AuditStampProps = {
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

/**
 * The audit cluster every business aggregate carries (`created_by/at`,
 * `updated_by/at`, `deleted_by/at`), as a single value object. Groups the
 * six fields so aggregates expose one `AuditStamp` rather than six loose
 * primitives, and centralises the soft-delete check. Pure TS; shared kit.
 */
export class AuditStamp extends ValueObject<AuditStampProps> {
  constructor(props: AuditStampProps) {
    super(props);
  }

  get created_by(): number | null {
    return this.props.created_by;
  }
  get updated_by(): number | null {
    return this.props.updated_by;
  }
  get deleted_by(): number | null {
    return this.props.deleted_by;
  }
  get created_at(): Date {
    return this.props.created_at;
  }
  get updated_at(): Date {
    return this.props.updated_at;
  }
  get deleted_at(): Date | null {
    return this.props.deleted_at;
  }

  isDeleted(): boolean {
    return this.props.deleted_at !== null;
  }
}
