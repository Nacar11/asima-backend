import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { UsersService } from '@/users/users.service';

@ValidatorConstraint({ async: true })
@Injectable()
export class UserValidator implements ValidatorConstraintInterface {
  constructor(private readonly userService: UsersService) {}

  async validate(value: number, args: any): Promise<boolean> {
    if (typeof value !== 'number') return false;

    const user = await this.userService.findById(value);

    if (user) {
      const targetObject = args.object as Record<string, any>;
      targetObject[args.property] = user;
      return true;
    }

    return false;
  }

  defaultMessage(): string {
    return 'User does not exist!';
  }
}
