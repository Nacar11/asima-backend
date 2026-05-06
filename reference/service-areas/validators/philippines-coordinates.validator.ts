import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

/**
 * Philippines geographic bounding box
 * These coordinates define the approximate boundaries of the Philippine archipelago
 */
export const PHILIPPINES_BOUNDS = {
  minLat: 4.5, // Southernmost point (near Tawi-Tawi)
  maxLat: 21.5, // Northernmost point (near Batanes)
  minLng: 116.0, // Westernmost point (near Palawan)
  maxLng: 127.0, // Easternmost point (near Davao Oriental)
} as const;

@ValidatorConstraint({ name: 'isPhilippinesLatitude', async: false })
export class IsPhilippinesLatitudeConstraint
  implements ValidatorConstraintInterface
{
  validate(latitude: number): boolean {
    if (latitude === null || latitude === undefined) return true; // Optional field
    return (
      latitude >= PHILIPPINES_BOUNDS.minLat &&
      latitude <= PHILIPPINES_BOUNDS.maxLat
    );
  }

  defaultMessage(): string {
    return `Latitude must be within the Philippines (${PHILIPPINES_BOUNDS.minLat}° to ${PHILIPPINES_BOUNDS.maxLat}°)`;
  }
}

@ValidatorConstraint({ name: 'isPhilippinesLongitude', async: false })
export class IsPhilippinesLongitudeConstraint
  implements ValidatorConstraintInterface
{
  validate(longitude: number): boolean {
    if (longitude === null || longitude === undefined) return true; // Optional field
    return (
      longitude >= PHILIPPINES_BOUNDS.minLng &&
      longitude <= PHILIPPINES_BOUNDS.maxLng
    );
  }

  defaultMessage(): string {
    return `Longitude must be within the Philippines (${PHILIPPINES_BOUNDS.minLng}° to ${PHILIPPINES_BOUNDS.maxLng}°)`;
  }
}

/**
 * Validates that a latitude value is within the Philippines geographic bounds
 * @param validationOptions - Optional validation options
 */
export function IsPhilippinesLatitude(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPhilippinesLatitudeConstraint,
    });
  };
}

/**
 * Validates that a longitude value is within the Philippines geographic bounds
 * @param validationOptions - Optional validation options
 */
export function IsPhilippinesLongitude(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPhilippinesLongitudeConstraint,
    });
  };
}
