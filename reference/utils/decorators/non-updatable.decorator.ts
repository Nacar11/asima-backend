import 'reflect-metadata';

export function NonUpdatable() {
  return function (target: any, propertyKey: string) {
    const existingFields: string[] =
      Reflect.getMetadata('nonUpdatableFields', target.constructor) || [];
    existingFields.push(propertyKey);
    Reflect.defineMetadata(
      'nonUpdatableFields',
      existingFields,
      target.constructor,
    );
  };
}
