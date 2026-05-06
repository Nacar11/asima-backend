import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Attribute } from '@/attributes/domain/attribute';
import { User } from '@/users/domain/user';

/**
 * Represents an attribute value in the domain layer.
 * An attribute value is a specific option or term for an attribute.
 * For example, if the attribute is "Color", the attribute values could be "Red", "Blue", "Green".
 */
export class AttributeValue {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  attribute_id: number;

  @ApiProperty({ example: 'Red' })
  value: string;

  @ApiPropertyOptional({ example: 0 })
  display_order: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this attribute value is the default for the product',
  })
  is_default?: boolean;

  @ApiPropertyOptional({ type: () => Attribute })
  attribute?: Attribute;

  @ApiPropertyOptional()
  created_by?: User;

  @ApiProperty()
  created_at: Date;

  @ApiPropertyOptional()
  updated_by?: User;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional()
  deleted_by?: User | null;

  @ApiPropertyOptional()
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
