import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISeedService } from '../seed.interface';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Service for seeding user addresses
 */
@Injectable()
export class UserAddressesSeedService implements ISeedService {
  constructor(
    @InjectRepository(UserAddressEntity)
    private repository: Repository<UserAddressEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.repository.count();

    if (!count) {
      const user = await this.userRepository.findOne({
        where: {
          id: 1,
        },
      });

      if (!user) {
        console.error(
          '❌ No user found. Cannot proceed to seed user addresses.',
        );
        return;
      }

      const addresses = [
        {
          user_id: user.id,
          label: 'Home',
          recipient_name: `${user.first_name} ${user.last_name}`,
          phone: user.phone || '09123456789',
          address_line1: '123 Main Street',
          address_line2: 'Barangay Central',
          city: 'Manila',
          state_province: 'Metro Manila',
          postal_code: '1000',
          country: 'Philippines',
          is_default: true,
          created_by: user,
          updated_by: user,
        },
        {
          user_id: user.id,
          label: 'Office',
          recipient_name: `${user.first_name} ${user.last_name}`,
          phone: user.phone || '09123456789',
          address_line1: '456 Business Avenue',
          address_line2: 'Suite 100',
          city: 'Makati',
          state_province: 'Metro Manila',
          postal_code: '1200',
          country: 'Philippines',
          is_default: false,
          created_by: user,
          updated_by: user,
        },
      ];

      await this.repository.save(
        addresses.map((address) => this.repository.create(address)),
      );

      console.log(`✅ ${addresses.length} user addresses seeded successfully`);
    }
  }
}
