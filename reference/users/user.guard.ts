import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class SellerGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) return false;
    const seller = await this.dataSource
      .getRepository('sellers')
      .findOne({ where: { user_id: userId } });
    return !!seller;
  }
}

@Injectable()
export class SystemAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const systemAdmin = this.reflector.getAllAndOverride<boolean>(
      'system_admin',
      [context.getClass(), context.getHandler()],
    );

    if (!systemAdmin) return true;

    const request = context.switchToHttp().getRequest();

    return systemAdmin == request.user?.system_admin;
  }
}
