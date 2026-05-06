import { Exclude } from 'class-transformer';
import { User } from '@/users/domain/user';
import { ApiProperty } from '@nestjs/swagger';

/**
 * BaseDomain class provides common auditing fields for entity tracking.
 *
 * @property {number} id - Unique identifier for the entity.
 * @property {Pick<User, 'id' | 'first_name' | 'last_name' | 'cost_center'>} created_by - User who created the entity.
 * @property {Date} created_at - Timestamp when the entity was created.
 * @property {Pick<User, 'id' | 'first_name' | 'last_name' | 'cost_center'>} updated_by - User who last updated the entity.
 * @property {Date} updated_at - Timestamp when the entity was last updated.
 * @property {Pick<User, 'id' | 'first_name' | 'last_name' | 'cost_center'> | null} deleted_by - User who deleted the entity (if applicable).
 * @property {Date | null} deleted_at - Timestamp when the entity was deleted (if applicable).
 * @property {string} [__entity] - Internal property used for exclusion in serialization.
 */
export class BaseDomain {
  @ApiProperty({
    type: Number,
  })
  id: number;

  @ApiProperty({
    type: () => User,
    nullable: false,
    example: { id: 1, first_name: 'John', last_name: 'Doe', cost_center: '00' },
  })
  created_by: Pick<User, 'id' | 'first_name' | 'last_name' | 'cost_center'>;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({
    type: () => User,
    nullable: false,
    example: { id: 1, first_name: 'John', last_name: 'Doe', cost_center: '00' },
  })
  updated_by: Pick<User, 'id' | 'first_name' | 'last_name' | 'cost_center'>;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({
    type: () => User,
    nullable: true,
    example: null,
  })
  deleted_by?: Pick<
    User,
    'id' | 'first_name' | 'last_name' | 'cost_center'
  > | null;

  @ApiProperty({
    example: null,
  })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
