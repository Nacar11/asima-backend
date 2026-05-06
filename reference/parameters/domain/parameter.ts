import { BaseMasterDomain } from '@/utils/domain/base-master.domain';
import { ApiProperty } from '@nestjs/swagger';

export class Parameter extends BaseMasterDomain {
  @ApiProperty({
    type: String,
    nullable: false,
    example: 'P001',
  })
  code: string;

  @ApiProperty({
    type: String,
    nullable: false,
    example: 'Parameter Name',
  })
  param_items: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'This is a description of the parameter.',
  })
  description: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'This is a value for the parameter.',
  })
  string_value: string;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 123.45,
  })
  numeric_value: number;

  @ApiProperty({
    type: Boolean,
    nullable: true,
    example: true,
  })
  boolean_value: boolean;

  @ApiProperty({
    type: Date,
    nullable: true,
    example: '2023-10-01T00:00:00Z',
  })
  date_value: Date;
}
