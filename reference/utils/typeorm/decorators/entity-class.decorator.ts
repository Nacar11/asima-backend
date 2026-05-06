import { UserEntity } from '@/users/persistence/entities/user.entity';
import { BindSignatoryUser } from '@/utils/typeorm/decorators/entity-property.decorator';
import { MenuCode } from '@/utils/types/menu-code.type';
import { JoinColumn, ManyToOne } from 'typeorm';

type SignatoriesType = 'endorsed_by' | 'reviewed_by' | 'approved_by';

type SignatoryOptions = {
  signatories?: SignatoriesType[];
  menuCode: MenuCode;
};
/**
 * Class decorator that dynamically attaches signatory fields and associated metadata
 * to an entity class for endorsement, review, and approval workflows.
 *
 * This decorator automates the creation of `ManyToOne` relations to a `UserEntity`,
 * along with `@JoinColumn` and custom metadata via `@BindSignatoryUser`. It enables
 * standardized support for user signatories in business processes.
 *
 * @param signatoryOptions - Options specifying which signatory roles to add and the associated `MenuCode`.
 * @param signatoryOptions.signatories - An optional array of signatory role names.
 *                                        If omitted, defaults to `['endorsed_by', 'reviewed_by', 'approved_by']`.
 * @param signatoryOptions.menuCode - A `MenuCode` enum value representing the module or process the signatories belong to.
 * @returns A class decorator function that extends the entity with user relations for each signatory.
 *
 * @template T - The target class type to which the decorator is applied.
 *
 * @example
 * @WithSignatories({ menuCode: MenuCode.DOCUMENT })
 * @Entity()
 * class Document {
 *   // Fields `endorsed_by`, `reviewed_by`, and `approved_by` will be automatically added
 * }
 */
export function WithSignatories(signatoryOptions: SignatoryOptions) {
  const { menuCode } = signatoryOptions;
  let { signatories } = signatoryOptions;

  // Set default signatories if none provided
  if (!signatories || signatories.length === 0) {
    signatories = ['endorsed_by', 'reviewed_by', 'approved_by'];
  }

  // Ensure uniqueness
  const uniqueSignatories = [...new Set(signatories)];

  return function <T extends { new (...args: any[]): object }>(constructor: T) {
    const metaDataKey = `signatory-types:${constructor.name}`;

    const existingSignatories: SignatoriesType[] =
      Reflect.getMetadata(metaDataKey, constructor.prototype) || [];

    const newSignatories = uniqueSignatories.filter(
      (type) => !existingSignatories.includes(type),
    );

    for (const newSignatory of newSignatories) {
      // Dynamically add the property to the prototype
      Object.defineProperty(constructor.prototype, newSignatory, {
        configurable: true,
        writable: true,
        enumerable: true,
      });

      // Define relation to UserEntity with ORM decorators
      ManyToOne(() => UserEntity, {
        eager: false,
        nullable: true,
        onDelete: 'SET NULL',
        cascade: true,
      })(constructor.prototype, newSignatory);

      // Add join column metadata
      JoinColumn({ name: newSignatory })(constructor.prototype, newSignatory);

      // Bind custom signatory metadata for use in business logic
      BindSignatoryUser(menuCode)(constructor.prototype, newSignatory);
    }

    // Update metadata to keep track of all signatory fields
    Reflect.defineMetadata(
      metaDataKey,
      [...existingSignatories, ...newSignatories],
      constructor.prototype,
    );

    return constructor;
  };
}
