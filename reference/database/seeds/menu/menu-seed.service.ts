import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISeedService } from '../seed.interface';
import { MenuEntity } from '@/menus/persistence/entities/menu.entity';
import { Repository } from 'typeorm';
import {
  // ERP-specific codes (commented out for adtokart)
  // procurement_codes,
  // goods_warehouse_inventory_codes,
  // sales_codes,
  // production_mfg_codes,
  // production_planning_codes,
  // mobile_master_codes,
  // common_master_codes,
  // Adtokart codes only
  store_management_codes,
  admin_content_codes,
  admin_global_codes,
  admin_panel_codes,
  adtokart_user_codes,
  seller_dashboard_codes,
  admin_wallet_codes,
  TSeedMenuCode,
} from '@/database/seeds/menu/menu-codes';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { MasterStatusEnum } from '@/utils/enums/status-enum';

@Injectable()
export class MenuSeedService implements ISeedService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(MenuEntity)
    private menuRepository: Repository<MenuEntity>,
  ) {}

  async run() {
    console.log('🌱 Checking menu codes...');
    const existingMenus = await this.menuRepository.find({
      select: ['menu_code'],
    });

    const existingMenuCodes = new Set(existingMenus.map((m) => m.menu_code));
    const menuCodes: TSeedMenuCode[] = [
      // Adtokart codes only
      ...adtokart_user_codes,
      ...store_management_codes,
      ...admin_content_codes,
      ...admin_global_codes,
      ...admin_panel_codes,
      ...seller_dashboard_codes,
      ...admin_wallet_codes,
    ];

    const missingMenuCodes = menuCodes.filter(
      (menu) => !existingMenuCodes.has(menu.code),
    );

    if (missingMenuCodes.length === 0) {
      console.log('✅ Skipping Menu Code seeding');
      return;
    }

    console.log('🌱 Seeding Menu Code...');
    const adminUser = await this.userRepository.findOne({
      where: {
        system_admin: true,
      },
    });

    if (!adminUser) {
      console.error('❌ No admin user. Cannot proceed to seed menu code.');
      return;
    }

    const defaultPermissions = [
      'View',
      'Create',
      'Edit',
      'Delete',
      'Endorse',
      'Review',
      'Approve',
      'Upload',
    ];

    const menuEntities: MenuEntity[] = missingMenuCodes.map(
      (menu: TSeedMenuCode) =>
        ({
          menu_code: menu.code,
          menu_name: this.generateMenuName(menu.name),
          permissions: defaultPermissions,
          status: MasterStatusEnum.ACTIVE,
          created_by: adminUser,
          updated_by: adminUser,
        }) as MenuEntity,
    );

    await this.menuRepository.save(menuEntities);
    console.log(`✅ Successfully seeded ${menuEntities.length} Menu Code.`);
  }

  private generateMenuName(menuName: string): string {
    return menuName.replace(/_/g, ' ').toUpperCase();
  }
}
