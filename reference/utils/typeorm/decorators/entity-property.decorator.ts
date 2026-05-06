import { MenuCode } from '@/utils/types/menu-code.type';
import 'reflect-metadata';

/**
 * Property decorator that marks a property to trigger control number generation.
 *
 * This decorator stores metadata linking the property to a specific `MenuCode`,
 * which is likely used elsewhere (e.g., in lifecycle hooks or services) to
 * automatically generate control numbers for the property.
 *
 * It also tracks the decorated property in a metadata list (`controlNumberProperties`)
 * for the class, allowing batch retrieval or processing of all such properties.
 *
 * @param menuCode - A `MenuCode` enum value representing the context or module for control number generation.
 * @returns A property decorator function.
 *
 * @throws Error if applied to a method (only valid on class properties).
 *
 * @example
 * class Document {
 *   @GenerateControlNumber(MenuCode.DOCUMENT)
 *   controlNo: string;
 * }
 */
export function GenerateControlNumber(menuCode: MenuCode) {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor?: PropertyDescriptor,
  ) {
    if (!propertyKey || descriptor) {
      throw new Error('@GenerateControlNumber can only be used on properties.');
    }

    const className = target.constructor.name;
    const metadataKey = `triggerGenerateControlNumber:${className}:${String(propertyKey)}`;

    Reflect.defineMetadata(metadataKey, menuCode, target, propertyKey);

    const decoratedProperties =
      Reflect.getMetadata('controlNumberProperties', target) || [];
    if (!decoratedProperties.includes(String(propertyKey))) {
      decoratedProperties.push(String(propertyKey));
      Reflect.defineMetadata(
        'controlNumberProperties',
        decoratedProperties,
        target,
      );
    }
  };
}

/**
 * Property decorator that associates a property with a signatory user binding operation.
 *
 * This decorator stores metadata linking the property to a specific `MenuCode`,
 * which can be used at runtime to bind or validate signatory users tied to
 * a business logic context (e.g., approval flow).
 *
 * @param menuCode - A `MenuCode` enum value representing the module or functional context.
 * @returns A property decorator function.
 *
 * @throws Error if applied to a method (only valid on class properties).
 *
 * @example
 * class Approval {
 *   @BindSignatoryUser(MenuCode.APPROVAL)
 *   approver: string;
 * }
 */
export function BindSignatoryUser(menuCode: MenuCode) {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor?: PropertyDescriptor,
  ) {
    if (!propertyKey || descriptor) {
      throw new Error('@BindSignatoryUser can only be used on properties.');
    }

    const className = target.constructor.name;
    const metadataKey = `triggerBindSignatoryUser:${className}:${String(propertyKey)}`;

    Reflect.defineMetadata(metadataKey, menuCode, target, propertyKey);
  };
}
