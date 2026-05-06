import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityTarget } from 'typeorm';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsExistConstraint implements ValidatorConstraintInterface {
  constructor(private readonly dataSource: DataSource) {}

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    if (!value) return false;

    const [entityClass, findCondition = 'id'] = args.constraints;

    try {
      const repository = this.dataSource.getRepository(entityClass);

      // Dynamic find condition based on the decorator usage
      const whereCondition =
        typeof findCondition === 'string'
          ? { [findCondition]: value }
          : findCondition(value, args);

      const existingEntity = await repository.findOne({
        where: whereCondition,
      });

      return !!existingEntity;
    } catch (error) {
      console.error('Existence validation error:', error);
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    const [entityClass, findCondition = 'id'] = args.constraints;
    return `${entityClass.name} with the given ${
      typeof findCondition === 'string' ? findCondition : 'condition'
    } does not exist`;
  }
}

export function IsExist(
  entityClass: EntityTarget<any>,
  findCondition?: string | ((value: any, args: ValidationArguments) => any),
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [entityClass, findCondition],
      validator: IsExistConstraint,
    });
  };
}
