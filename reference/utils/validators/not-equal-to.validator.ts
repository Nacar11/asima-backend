import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

// Custom validator to check that two fields are not equal
export function NotEqualTo(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'notEqualTo',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          if (value === undefined || relatedValue === undefined) return true;
          return value !== relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} must not be equal to ${relatedPropertyName}`;
        },
      },
    });
  };
}
