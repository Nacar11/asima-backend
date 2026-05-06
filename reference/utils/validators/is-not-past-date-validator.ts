import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isFutureDate', async: false })
export class IsNotPastDateValidator implements ValidatorConstraintInterface {
  validate(value: string) {
    const inputDate = new Date(value);
    const today = new Date();

    inputDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return inputDate >= today;
  }

  defaultMessage() {
    return 'The required date must not be in the past.';
  }
}
