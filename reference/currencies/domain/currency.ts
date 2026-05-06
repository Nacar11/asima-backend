import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { User } from '@/users/domain/user';

export class Currency {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({
    type: String,
    example: 'PHP',
    description: 'ISO 4217 currency code',
  })
  code: string;

  @ApiProperty({
    type: String,
    example: 'Philippine Peso',
  })
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: '₱',
    nullable: true,
  })
  symbol?: string | null;

  @ApiProperty({
    type: Number,
    example: 1.0,
    description: 'Exchange rate relative to PHP',
  })
  exchange_rate_to_php: number;

  @ApiProperty({
    type: String,
    example: 'Active',
    default: 'Active',
  })
  status: string;

  @ApiPropertyOptional({
    type: () => User,
    nullable: true,
  })
  created_by?: User | null;

  @ApiProperty()
  created_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    nullable: true,
  })
  updated_by?: User | null;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    nullable: true,
  })
  deleted_by?: User | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
