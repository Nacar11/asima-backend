import { User } from '@/users/domain/user';
import { UserEntity } from '@/users/persistence/entities/user.entity';

export class GetUserPermissionsMapper {
  static toDomain(raw: any): Record<string, any> {
    if (!raw || !Array.isArray(raw)) {
      return {};
    }

    const userAssignments = raw.flatMap((user) => user?.assignments || []);
    const userGroups = userAssignments
      .flatMap((assignment) => assignment?.group?.user_permissions || [])
      .filter((permission) => permission != null);

    const userPermissions = userGroups
      .filter(
        (userGroup) =>
          userGroup?.menu?.menu_code && Array.isArray(userGroup?.permissions),
      )
      .map((userGroup) => ({
        menu_code: userGroup.menu.menu_code,
        permissions: userGroup.permissions,
      }));

    const mergedData: Record<string, string[]> = {};

    userPermissions.forEach((item) => {
      if (!item.menu_code || !item.permissions) return;

      if (mergedData[item.menu_code]) {
        // Merge permissions, removing duplicates
        mergedData[item.menu_code] = [
          ...new Set([...mergedData[item.menu_code], ...item.permissions]),
        ];
      } else {
        mergedData[item.menu_code] = [...item.permissions];
      }
    });

    return mergedData;
  }

  static toPersistence(domainEntity: User): UserEntity {
    const persistenceEntity = new UserEntity();

    Object.assign(
      persistenceEntity,
      domainEntity as Omit<User, 'id' | 'cost_center'>,
    );

    return persistenceEntity;
  }
}
