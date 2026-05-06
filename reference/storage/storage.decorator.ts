import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidFileUpload', async: false })
export class IsValidFileUploadConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments) {
    const obj = args.object as any;
    // Check if at least one file type is present and not empty
    if (obj.file) {
      return true;
    }
    if (
      obj.base64_file &&
      typeof obj.base64_file === 'string' &&
      obj.base64_file.trim() !== ''
    ) {
      return true;
    }
    return false;
  }

  defaultMessage() {
    return 'Either file or base64_file must be provided';
  }
}

export function IsValidFileUpload(validationOptions?: ValidationOptions) {
  return function (target: any) {
    registerDecorator({
      name: 'isValidFileUpload',
      target: target,
      propertyName: 'file', // Added this required property
      options: validationOptions,
      validator: IsValidFileUploadConstraint,
      constraints: [], // Added constraints array
    });
  };
}
