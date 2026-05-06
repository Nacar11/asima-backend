import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISeedService } from '../seed.interface';
import { UserPermissionEntity } from '@/user-permissions/persistence/entities/user-permission.entity';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { MenuEntity } from '@/menus/persistence/entities/menu.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { StatusEnum } from '@/user-permissions/user-permissions.enum';
import {
  ALL_PERMISSIONS,
  READ_ONLY,
  READ_WRITE,
  READ_WRITE_DELETE,
  READ_CREATE_EDIT,
} from '@/permissions/permission.constants';

@Injectable()
export class UserPermissionSeedService implements ISeedService {
  constructor(
    @InjectRepository(UserPermissionEntity)
    private readonly userPermissionRepository: Repository<UserPermissionEntity>,
    @InjectRepository(UserGroupEntity)
    private readonly userGroupRepository: Repository<UserGroupEntity>,
    @InjectRepository(MenuEntity)
    private readonly menuRepository: Repository<MenuEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async run() {
    console.log('🌱 Checking user permissions...');

    // Permission matrix - what each group can do
    // Based on the permission table provided
    const permissionMatrix: Record<string, Record<string, string[]>> = {
      Admin: {
        // Admin has full access to everything (all 8 permissions)
        MU01: ALL_PERMISSIONS,
        MU02: ALL_PERMISSIONS,
        MU03: ALL_PERMISSIONS,
        MF01: ALL_PERMISSIONS,
        SM01: ALL_PERMISSIONS,
        SM02: ALL_PERMISSIONS,
        SM03: ALL_PERMISSIONS,
        SM04: ALL_PERMISSIONS,
        SM05: ALL_PERMISSIONS,
        SM06: ALL_PERMISSIONS,
        SM08: ALL_PERMISSIONS,
        SM09: ALL_PERMISSIONS,
        SUG1: ALL_PERMISSIONS,
        SMB1: ALL_PERMISSIONS,
        SV01: ALL_PERMISSIONS,
        SM10: ALL_PERMISSIONS, // Services (Etravajoe)
        SM11: ALL_PERMISSIONS, // Service Categories (Etravajoe)
        SM12: ALL_PERMISSIONS, // Service Areas (Etravajoe)
        SM13: ALL_PERMISSIONS, // Materials
        SM14: ALL_PERMISSIONS, // Agenda
        SM15: ALL_PERMISSIONS, // Detailed Report
        SM16: ALL_PERMISSIONS, // Service Booking
        AC01: ALL_PERMISSIONS, // Categories (Global)
        AC02: ALL_PERMISSIONS, // Media (Sellers)
        AC03: ALL_PERMISSIONS, // Reviews
        AC04: ALL_PERMISSIONS, // Service Categories (Global)
        AC05: ALL_PERMISSIONS, // Services (Global)
        AC06: ALL_PERMISSIONS, // Service Areas (Global)
        AC07: ALL_PERMISSIONS, // Bookings
        AC08: ALL_PERMISSIONS, // Merchants
        AC09: ALL_PERMISSIONS, // Vouchers (Global)
        AC10: ALL_PERMISSIONS, // Membership Voucher Configurations (Global)
        AC11: ALL_PERMISSIONS, // Membership Plans
        AP04: ALL_PERMISSIONS, // Content Moderation
        AP05: ALL_PERMISSIONS, // Pickleball Merchant Applications
        AW01: ALL_PERMISSIONS, // Admin Wallet Management
      },
      'Store Owner': {
        // Full access to store management, no access to user/franchises management
        // No permissions: MU01, MU02, MU03, MF01, AC01
        SM01: ALL_PERMISSIONS,
        SM02: ALL_PERMISSIONS,
        SM03: ALL_PERMISSIONS,
        SM04: ALL_PERMISSIONS,
        SM05: ALL_PERMISSIONS,
        SM06: ALL_PERMISSIONS,
        SM08: ALL_PERMISSIONS,
        SM09: ALL_PERMISSIONS,
        SM10: ALL_PERMISSIONS,
        SM11: ALL_PERMISSIONS,
        SM12: ALL_PERMISSIONS,
        SM13: ALL_PERMISSIONS,
        SM14: ALL_PERMISSIONS,
        SM15: ALL_PERMISSIONS,
        SM16: ALL_PERMISSIONS,
        SUG1: ALL_PERMISSIONS,
        SMB1: ALL_PERMISSIONS,
        SV01: ALL_PERMISSIONS,
        AC02: ALL_PERMISSIONS,
        AC03: READ_WRITE_DELETE,
        SW01: ALL_PERMISSIONS, // Seller Wallet
      },
      'Store Member': {
        // Limited access to store management
        // No permissions: MU01, MU02, MU03, MF01, SM05, SM09, SM15
        SM01: READ_WRITE,
        SM02: READ_WRITE_DELETE,
        SM03: READ_WRITE_DELETE,
        SM04: READ_WRITE_DELETE,
        SM06: READ_WRITE,
        SM08: READ_WRITE,
        SV01: READ_WRITE,
        SM10: READ_WRITE,
        SM11: READ_WRITE,
        SM12: READ_WRITE,
        SM13: READ_WRITE,
        SM14: READ_ONLY,
        AC01: READ_ONLY,
        AC02: READ_ONLY,
        AC03: READ_ONLY,
      },
      Customer: {
        // Read-only access for products, categories, tags, attributes, orders, returns
        // No permissions: MU01, MU02, MU03, MF01, SM05, SM09, SM13, SM14, SM15, AC02
        MU04: READ_WRITE, // My Profile - view and edit own
        SM01: READ_ONLY,
        SM02: READ_ONLY,
        SM03: READ_ONLY,
        SM04: READ_ONLY,
        SM06: READ_ONLY, // View own orders
        SM08: READ_ONLY, // View own returns
        SM10: READ_ONLY,
        SM11: READ_ONLY,
        SM12: READ_ONLY,
        AC01: READ_ONLY,
        AC03: READ_CREATE_EDIT, // Can view, create, and edit own reviews
        AC10: READ_ONLY, // Membership Voucher Configurations (Global)
        AC11: READ_ONLY, // Membership Plans
      },
    };

    // Get admin user for audit fields
    const adminUser = await this.userRepository.findOne({
      where: { system_admin: true },
    });

    if (!adminUser) {
      console.error(
        '❌ No admin user. Cannot proceed to seed user permissions.',
      );
      return;
    }

    // Get all groups
    const groups = await this.userGroupRepository.find();
    const groupMap = new Map(groups.map((g) => [g.group_name, g]));

    // Get all menus
    const menus = await this.menuRepository.find();
    const menuMap = new Map(menus.map((m) => [m.menu_code, m]));

    // Get existing permissions to avoid duplicates
    const existingPermissions = await this.userPermissionRepository.find({
      relations: ['group', 'menu'],
    });
    const existingPermissionKeys = new Set(
      existingPermissions.map((p) => `${p.group.id}-${p.menu.id}`),
    );

    const permissionsToCreate: Partial<UserPermissionEntity>[] = [];

    // Seed permissions for each group
    for (const [groupName, menuPermissions] of Object.entries(
      permissionMatrix,
    )) {
      const group = groupMap.get(groupName);
      if (!group) {
        console.log(`⚠️ Group "${groupName}" not found. Skipping.`);
        continue;
      }

      for (const [menuCode, permissions] of Object.entries(menuPermissions)) {
        const menu = menuMap.get(menuCode);
        if (!menu) {
          console.log(`⚠️ Menu "${menuCode}" not found. Skipping.`);
          continue;
        }

        // Check if permission already exists
        const key = `${group.id}-${menu.id}`;
        if (existingPermissionKeys.has(key)) {
          continue;
        }

        permissionsToCreate.push({
          group,
          menu,
          permissions,
          status: StatusEnum.ACTIVE,
          created_by: adminUser,
          updated_by: adminUser,
        });
      }
    }

    if (permissionsToCreate.length === 0) {
      console.log(
        '✅ Skipping User Permission seeding - all permissions exist',
      );
      return;
    }

    console.log(
      `🌱 Seeding ${permissionsToCreate.length} User Permission(s)...`,
    );

    await this.userPermissionRepository.save(permissionsToCreate);
    console.log(
      `✅ Successfully seeded ${permissionsToCreate.length} User Permission(s).`,
    );
  }
}
