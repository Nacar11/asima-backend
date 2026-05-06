import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...menuCode) =>
  SetMetadata(PERMISSIONS_KEY, menuCode);
