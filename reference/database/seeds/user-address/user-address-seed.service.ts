import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ISeedService } from '../seed.interface';

@Injectable()
export class UserAddressSeedService implements ISeedService {
  constructor(
    @InjectRepository(UserAddressEntity)
    private repository: Repository<UserAddressEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(SellerEntity)
    private sellerRepository: Repository<SellerEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.repository.count();

    if (count > 0) {
      console.log('⚠️  User addresses already exist, skipping seed');
      return;
    }

    // Get admin user
    const adminUser = await this.userRepository.findOne({
      where: { id: 1 },
    });

    // Get john.doe user specifically
    const johnDoeUser = await this.userRepository.findOne({
      where: { email: 'john.doe@cody.inc' },
    });

    // Get jane.smith user
    const janeSmithUser = await this.userRepository.findOne({
      where: { email: 'jane.smith@cody.inc' },
    });

    // Get owner (user_id 6 - MEPF Solutions Provider / seller id 4)
    const ownerUser = await this.userRepository.findOne({
      where: { email: 'owner@cody.inc' },
    });

    if (!adminUser) {
      console.error('❌ No admin user found. Cannot seed user addresses.');
      return;
    }

    const addressesToCreate: Partial<UserAddressEntity>[] = [];

    // Admin user addresses - around IT Park area
    addressesToCreate.push(
      {
        user_id: adminUser.id,
        label: 'Home',
        recipient_name: `${adminUser.first_name} ${adminUser.last_name}`,
        phone: '+63 917 123 4567',
        address_line1: '123 Lahug Street',
        address_line2: 'Brgy. Lahug',
        city: 'Cebu City',
        state_province: 'Cebu',
        postal_code: '6000',
        country: 'Philippines',
        is_default: true,
        // Near IT Park, Cebu (~2km from seller)
        latitude: 10.332,
        longitude: 123.905,
        created_by: adminUser,
        updated_by: adminUser,
      },
      {
        user_id: adminUser.id,
        label: 'Office',
        recipient_name: `${adminUser.first_name} ${adminUser.last_name}`,
        phone: '+63 917 123 4567',
        address_line1: 'Ayala Center Cebu',
        address_line2: 'Cebu Business Park',
        city: 'Cebu City',
        state_province: 'Cebu',
        postal_code: '6000',
        country: 'Philippines',
        is_default: false,
        // Ayala Center Cebu (~1.5km from IT Park seller)
        latitude: 10.3181,
        longitude: 123.905,
        created_by: adminUser,
        updated_by: adminUser,
      },
    );

    // John Doe addresses - Mandaue area
    if (johnDoeUser) {
      addressesToCreate.push(
        {
          user_id: johnDoeUser.id,
          label: 'Home',
          recipient_name: `${johnDoeUser.first_name} ${johnDoeUser.last_name}`,
          phone: '+63 917 234 5678',
          address_line1: '456 A.S. Fortuna Street',
          address_line2: 'Brgy. Bakilid',
          city: 'Mandaue City',
          state_province: 'Cebu',
          postal_code: '6014',
          country: 'Philippines',
          is_default: true,
          // Mandaue (~5km from IT Park seller)
          latitude: 10.328,
          longitude: 123.945,
          created_by: johnDoeUser,
          updated_by: johnDoeUser,
        },
        {
          user_id: johnDoeUser.id,
          label: 'Office',
          recipient_name: `${johnDoeUser.first_name} ${johnDoeUser.last_name}`,
          phone: '+63 917 234 5678',
          address_line1: 'J Centre Mall',
          address_line2: 'A.S. Fortuna Street',
          city: 'Mandaue City',
          state_province: 'Cebu',
          postal_code: '6014',
          country: 'Philippines',
          is_default: false,
          // J Centre Mall (~4km from IT Park seller)
          latitude: 10.3295,
          longitude: 123.9421,
          created_by: johnDoeUser,
          updated_by: johnDoeUser,
        },
        {
          user_id: johnDoeUser.id,
          label: 'Parents House',
          recipient_name: 'Juan Doe',
          phone: '+63 917 234 5679',
          address_line1: '123 Mango Avenue',
          address_line2: 'Brgy. Kamputhaw',
          city: 'Cebu City',
          state_province: 'Cebu',
          postal_code: '6000',
          country: 'Philippines',
          is_default: false,
          // Downtown Cebu (~3km from IT Park seller)
          latitude: 10.3103,
          longitude: 123.8916,
          created_by: johnDoeUser,
          updated_by: johnDoeUser,
        },
      );
    }

    // Jane Smith addresses - Talisay (farther)
    if (janeSmithUser) {
      addressesToCreate.push({
        user_id: janeSmithUser.id,
        label: 'Home',
        recipient_name: `${janeSmithUser.first_name} ${janeSmithUser.last_name}`,
        phone: '+63 917 345 6789',
        address_line1: '789 Tabunok Road',
        address_line2: 'Brgy. Tabunok',
        city: 'Talisay City',
        state_province: 'Cebu',
        postal_code: '6045',
        country: 'Philippines',
        is_default: true,
        // Talisay (~12km from IT Park seller)
        latitude: 10.2447,
        longitude: 123.8494,
        created_by: janeSmithUser,
        updated_by: janeSmithUser,
      });
    }

    // Owner (user_id 6) - Walk-in location for Tambayan District (seller id 4)
    if (ownerUser) {
      addressesToCreate.push({
        user_id: ownerUser.id,
        label: 'Walk-in location',
        recipient_name: `${ownerUser.first_name} ${ownerUser.last_name}`,
        phone: '+63 32 345 6789',
        address_line1: 'Tambayan District, Basak',
        address_line2: 'Tambayan District',
        city: 'Lapu-Lapu City',
        state_province: 'Cebu',
        postal_code: '6015',
        country: 'Philippines',
        is_default: true,
        latitude: 10.3103,
        longitude: 123.9494,
        created_by: ownerUser,
        updated_by: ownerUser,
      });
    }

    // Save all addresses
    for (const address of addressesToCreate) {
      await this.repository.save(this.repository.create(address));
    }

    // Link seller id 4 (Ulrak Pickle Ball Hub, user_id 6) to that user's walk-in address
    if (ownerUser) {
      const ownerAddress = await this.repository.findOne({
        where: { user_id: ownerUser.id },
        order: { id: 'ASC' },
      });
      if (ownerAddress) {
        const seller4 = await this.sellerRepository.findOne({
          where: { id: 4 },
        });
        if (seller4) {
          await this.sellerRepository.update(
            { id: 4 },
            { service_location_address_id: ownerAddress.id },
          );
          console.log(
            `✅ Seller id 4 (Ulrak Pickle Ball Hub) linked to walk-in address id ${ownerAddress.id}`,
          );
        }
      }
    }

    console.log(
      `✅ User addresses seeded successfully (${addressesToCreate.length} addresses created)`,
    );
  }
}
