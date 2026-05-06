import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'OperatingDaysValidator', async: false })
export class OperatingDaysValidator implements ValidatorConstraintInterface {
  private readonly validKeys = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ];
  private readonly validValues = [0, 1];

  validate(value: Record<string, any>): boolean {
    if (!value || typeof value !== 'object') return false;

    return Object.entries(value).every(
      ([key, val]) =>
        this.validKeys.includes(key) && this.validValues.includes(val),
    );
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be an object with keys ${this.validKeys.join(
      ', ',
    )} and values as ${this.validValues.join(' or ')}`;
  }
}
