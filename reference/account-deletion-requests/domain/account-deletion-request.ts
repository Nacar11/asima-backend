import { ApiProperty } from '@nestjs/swagger';

export enum AccountDeletionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export class AccountDeletionRequest {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty({ required: false })
  phone_number?: string;

  @ApiProperty()
  account_type: string;

  @ApiProperty()
  reason: string;

  @ApiProperty({ required: false })
  additional_comments?: string;

  @ApiProperty()
  ip_address: string;

  @ApiProperty()
  user_agent: string;

  @ApiProperty({ enum: AccountDeletionStatus })
  status: AccountDeletionStatus;

  @ApiProperty()
  reference_number: string;

  @ApiProperty({ required: false })
  processed_by_id?: string;

  @ApiProperty({ required: false })
  processed_at?: Date;

  @ApiProperty({ required: false })
  processing_notes?: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({ required: false })
  deleted_at?: Date;
}
