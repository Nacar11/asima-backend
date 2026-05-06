import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isAdmin = this.reflector.getAllAndOverride<boolean>('isAdmin', [
      context.getClass(),
      context.getHandler(),
    ]);

    // If isAdmin metadata is not defined, grant access
    if (isAdmin === undefined) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If isAdmin is true, check if the user is an admin
    if (isAdmin && !user?.system_admin) {
      return false; // Access denied if the user is not a system admin
    }

    return true; // Access granted
  }
}
