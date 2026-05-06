import { Transform } from 'class-transformer';
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsEnumMultiSelectValidator<T>(
  enumType: T,
  validationOptions?: ValidationOptions,
) {
  return (target: object, propertyName: string | symbol): void => {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [enumType],
      validator: {
        validate(value: string, args: ValidationArguments): boolean {
          if (!value) return true;
          const enumValues = new Set(Object.values(args.constraints[0]));
          return value.split(',').every((item) => enumValues.has(item.trim()));
        },
        defaultMessage(args: ValidationArguments): string {
          const allowedValues = Object.values(args.constraints[0]).join(', ');
          return `Each value must be one of the following: ${allowedValues}`;
        },
      },
    });

    // Add transformation to ensure enum strings are normalized
    Transform(({ value }) => {
      if (!value) return value; // Skip transformation if no value
      return value
        .split(',')
        .map((item: string) => {
          return item
            .trim()
            .toLowerCase()
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        })
        .join(',');
    })(target, propertyName);
  };
}
