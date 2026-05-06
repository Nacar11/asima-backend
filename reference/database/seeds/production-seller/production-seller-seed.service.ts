import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { StatusEnum } from '@/utils/enums/status-enum';
import { StatusEnum as UserAssignmentStatusEnum } from '@/user-assignments/user-assignments.enum';
import { ISeedService } from '../seed.interface';

@Injectable()
export class ProductionSellerSeedService implements ISeedService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(SellerEntity)
    private sellerRepository: Repository<SellerEntity>,
    @InjectRepository(UserGroupEntity)
    private userGroupRepository: Repository<UserGroupEntity>,
    @InjectRepository(UserAssignmentEntity)
    private userAssignmentRepository: Repository<UserAssignmentEntity>,
  ) {}

  async run(): Promise<void> {
    console.log('🌱 Running Production Seller Seed...');

    // 1. Ensure owner@cody.inc user exists
    const ownerEmail = 'owner@cody.inc';
    let ownerUser = await this.userRepository.findOne({
      where: { email: ownerEmail },
    });

    if (!ownerUser) {
      console.log(`  📝 Creating user: ${ownerEmail}`);
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash('pWFX75iNGb0', salt);

      ownerUser = await this.userRepository.save(
        this.userRepository.create({
          user_id: '1000001',
          first_name: 'Store',
          last_name: 'Owner',
          email: ownerEmail,
          password,
          salt,
          system_admin: false,
        }),
      );
      console.log(`  ✅ User created: ${ownerEmail} (ID: ${ownerUser.id})`);
    } else {
      console.log(
        `  ℹ️ User already exists: ${ownerEmail} (ID: ${ownerUser.id})`,
      );
    }

    // 2. Assign user to "Store Owner" group
    const storeOwnerGroup = await this.userGroupRepository.findOne({
      where: { group_name: 'Store Owner' },
    });

    if (!storeOwnerGroup) {
      console.error(
        '  ❌ "Store Owner" user group not found. Please run UserGroupSeedService first.',
      );
      return;
    }

    const existingAssignment = await this.userAssignmentRepository.findOne({
      where: {
        user: { id: ownerUser.id },
        group: { id: storeOwnerGroup.id },
      },
    });

    if (!existingAssignment) {
      console.log(`  📌 Assigning ${ownerEmail} → Store Owner`);

      // Get admin user for audit fields
      const adminUser = await this.userRepository.findOne({
        where: { email: 'admin@cody.inc' },
      });

      await this.userAssignmentRepository.save(
        this.userAssignmentRepository.create({
          user: ownerUser,
          group: storeOwnerGroup,
          status: UserAssignmentStatusEnum.ACTIVE,
          created_by: adminUser || ownerUser,
          updated_by: adminUser || ownerUser,
        }),
      );
      console.log(`  ✅ User assigned to Store Owner group`);
    } else {
      console.log(`  ℹ️ User already assigned to Store Owner group`);
    }

    // 3. Create Ulrak Pickle Ball Hub seller
    const existingSeller = await this.sellerRepository.findOne({
      where: { user_id: ownerUser.id },
    });

    if (!existingSeller) {
      console.log('  🏪 Creating Ulrak Pickle Ball Hub seller...');

      await this.sellerRepository.save(
        this.sellerRepository.create({
          id: 4,
          user_id: ownerUser.id,
          store_name: 'Ulrak Pickle Ball Hub',
          store_description:
            'Ulrak Pickle Ball Hub is a premier pickleball facility located inside Anjo World, Belmont One, Minglanilla, Cebu. Featuring two full-size regulation courts with proper lighting and ventilation.',
          contact: '0919 069 2100',
          email: 'ulrak@example.com',
          website: null,
          store_logo_url: null,
          store_banner_url: null,
          business_registration_number: null,
          tax_id: null,
          bank_account_holder: null,
          bank_account_number: null,
          bank_name: null,
          is_verified: true,
          is_active: true,
          slug: 'ulrak-pickle-ball-hub',
          status: StatusEnum.ACTIVE,
          total_sales: 0,
          total_reviews: 0,
          sells_products: false,
          sells_services: true,
          pickup_address:
            'Ulrak Pickle Ball Hub, Upper Belmont One, South Road, Minglanilla',
          pickup_city: 'Minglanilla',
          pickup_province: 'Cebu',
          pickup_postal_code: '6046',
          pickup_latitude: 10.2356,
          pickup_longitude: 123.7994,
          service_location_address_id: null,
          created_by: ownerUser,
          updated_by: ownerUser,
        }),
      );
      console.log('  ✅ Ulrak Pickle Ball Hub seller created (ID: 4)');
    } else {
      console.log('  ℹ️ Seller already exists for owner@cody.inc');

      // Update seller details if needed
      const shouldUpdate =
        existingSeller.store_name !== 'Ulrak Pickle Ball Hub' ||
        existingSeller.contact !== '0919 069 2100' ||
        existingSeller.email !== 'ulrak@example.com';

      if (shouldUpdate) {
        console.log('  🔄 Updating seller details...');
        await this.sellerRepository.save({
          ...existingSeller,
          store_name: 'Ulrak Pickle Ball Hub',
          store_description:
            'Ulrak Pickle Ball Hub is a premier pickleball facility located inside Anjo World, Belmont One, Minglanilla, Cebu. Featuring two full-size regulation courts with proper lighting and ventilation.',
          contact: '0919 069 2100',
          email: 'ulrak@example.com',
          pickup_address:
            'Ulrak Pickle Ball Hub, Upper Belmont One, South Road, Minglanilla',
          pickup_city: 'Minglanilla',
          pickup_province: 'Cebu',
          pickup_postal_code: '6046',
          pickup_latitude: 10.2356,
          pickup_longitude: 123.7994,
          sells_products: false,
          sells_services: true,
          updated_by: ownerUser,
        });
        console.log('  ✅ Seller details updated');
      }
    }

    console.log('✅ Production Seller seed completed');
  }
}
