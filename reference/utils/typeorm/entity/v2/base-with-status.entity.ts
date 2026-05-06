import { BaseEntityHelper } from '@/utils/typeorm/entity/base.entity';
import { Column } from 'typeorm';

/**
 * Abstract helper class extending `BaseEntityHelper`, providing utility methods
 * for entity definitions that include status-based enums.
 */
export abstract class BaseWithStatusEntityHelper extends BaseEntityHelper {
  /**
   * Creates a property decorator for an enum column with a default value.
   *
   * This utility is intended to simplify the definition of enum columns in
   * TypeORM entity classes. It extracts string-based enum values, sets up the
   * column type as `'enum'`, enforces non-nullability, and assigns a default.
   *
   * @template E - The enum type.
   * @param enumType - The enum object to be used for the column.
   * @param defaultValue - The default value for the column, must be a key of the enum.
   * @returns A TypeORM `PropertyDecorator` for the enum column.
   *
   * @example
   * enum Status {
   *   ACTIVE = 'active',
   *   INACTIVE = 'inactive'
   * }
   *
   * @Entity()
   * class User extends BaseWithStatusEntityHelper {
   *   @BaseWithStatusEntityHelper.createEnumColumn(Status, Status.ACTIVE)
   *   status: Status;
   * }
   */
  protected static createEnumColumn<E extends object>(
    enumType: E,
    defaultValue: keyof E,
  ): PropertyDecorator {
    const enumValues = Object.values(enumType).filter(
      (value) => typeof value === 'string',
    );

    return Column({
      type: 'enum',
      enum: enumValues,
      default: defaultValue,
      nullable: false,
    });
  }
}
