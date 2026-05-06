import { MenusService } from '@/menus/menus.service';
import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: true })
@Injectable()
export class MenuExistsConstraint implements ValidatorConstraintInterface {
  constructor(private readonly menuService: MenusService) {}

  async validate(value: any): Promise<boolean> {
    if (!value) return false;

    const menu = await this.menuService.findById(value);
    return !!menu;
  }

  defaultMessage(args: ValidationArguments) {
    return `Menu with ID ${args.value} not found`;
  }
}

export function MenuExists() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: { message: `Menu with ID does not exist` },
      constraints: [],
      validator: MenuExistsConstraint,
    });
  };
}
