import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { StatusEnum } from '@/utils/enums/status-enum';
import { ISeedService } from '../seed.interface';

@Injectable()
export class SellerSeedService implements ISeedService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(SellerEntity)
    private repository: Repository<SellerEntity>,
  ) {}

  async run(): Promise<void> {
    const requiredEmails = [
      'admin@cody.inc',
      'john.doe@cody.inc',
      'jane.smith@cody.inc',
      'owner@cody.inc',
    ];
    const usersByEmail = new Map<string, UserEntity>();
    const users = await this.userRepository.find();
    for (const user of users) {
      usersByEmail.set(user.email.toLowerCase(), user);
    }
    const requiredUsers: UserEntity[] = [];
    for (const email of requiredEmails) {
      const user = usersByEmail.get(email.toLowerCase());
      if (!user) {
        console.error(
          '❌ Missing required users. Cannot proceed to seed sellers. Please run user seeder first.',
        );
        return;
      }
      requiredUsers.push(user);
    }
    const [sellerUser1, sellerUser2, sellerUser3, sellerUser6] = requiredUsers;
    const ensureSeller = async (input: {
      readonly id: number;
      readonly user: UserEntity;
      readonly store_name: string;
      readonly store_description: string;
      readonly contact: string;
      readonly email: string;
      readonly website?: string | null;
      readonly pickup_address: string;
      readonly pickup_city: string;
      readonly pickup_province: string;
      readonly pickup_postal_code: string;
      readonly pickup_latitude: number;
      readonly pickup_longitude: number;
      readonly sells_products?: boolean;
      readonly sells_services?: boolean;
      readonly service_location_address_id?: number | null;
    }): Promise<void> => {
      const existing = await this.repository.findOne({
        where: { user_id: input.user.id },
      });
      if (!existing) {
        await this.repository.save(
          this.repository.create({
            id: input.id,
            user_id: input.user.id,
            store_name: input.store_name,
            store_description: input.store_description,
            contact: input.contact,
            email: input.email,
            website: input.website ?? null,
            store_logo_url: null,
            store_banner_url: null,
            business_registration_number: null,
            tax_id: null,
            bank_account_holder: null,
            bank_account_number: null,
            bank_name: null,
            is_verified: true,
            is_active: true,
            slug: input.store_name.toLowerCase().replace(/\s+/g, '-'),
            status: StatusEnum.ACTIVE,
            total_sales: 0,
            total_reviews: 0,
            sells_products: input.sells_products ?? true,
            sells_services: input.sells_services ?? false,
            pickup_address: input.pickup_address,
            pickup_city: input.pickup_city,
            pickup_province: input.pickup_province,
            pickup_postal_code: input.pickup_postal_code,
            pickup_latitude: input.pickup_latitude,
            pickup_longitude: input.pickup_longitude,
            service_location_address_id:
              input.service_location_address_id ?? null,
            created_by: input.user,
            updated_by: input.user,
          }),
        );
        return;
      }
      const shouldUpdate =
        existing.store_name !== input.store_name ||
        (existing.store_description ?? null) !== input.store_description ||
        existing.contact !== input.contact ||
        existing.email !== input.email ||
        (existing.website ?? null) !== (input.website ?? null);
      if (!shouldUpdate) {
        return;
      }
      await this.repository.save({
        ...existing,
        store_name: input.store_name,
        store_description: input.store_description,
        contact: input.contact,
        email: input.email,
        website: input.website ?? null,
        updated_by: input.user,
      });
    };
    await ensureSeller({
      id: 1,
      user: sellerUser1,
      store_name: 'Tech Store',
      store_description: 'Electronics, gadgets, and coffee gear store',
      contact: '+63 32 123 4567',
      email: 'techstore@example.com',
      website: 'https://techstore.example.com',
      pickup_address: 'IT Park, Apas',
      pickup_city: 'Cebu City',
      pickup_province: 'Cebu',
      pickup_postal_code: '6000',
      pickup_latitude: 10.3297,
      pickup_longitude: 123.9056,
    });
    await ensureSeller({
      id: 2,
      user: sellerUser2,
      store_name: 'Fashion Boutique',
      store_description: 'Trendy clothing and lifestyle items',
      contact: '+63 32 234 5678',
      email: 'fashion@example.com',
      website: 'https://fashionboutique.example.com',
      pickup_address: 'Ayala Center Cebu, Cebu Business Park',
      pickup_city: 'Cebu City',
      pickup_province: 'Cebu',
      pickup_postal_code: '6000',
      pickup_latitude: 10.3181,
      pickup_longitude: 123.905,
    });
    // Uncle Brew franchise seller (jane.smith@cody.inc - user_id 3)
    await ensureSeller({
      id: 3,
      user: sellerUser3,
      store_name: 'Uncle Brew',
      store_description:
        'Franchise supplies store for Uncle Brew locations: equipment, packaging, and ingredients for operations.',
      contact: '+63 32 345 6789',
      email: 'unclebrew@example.com',
      website: null, // optional
      pickup_address: 'Poblacion, Talisay City',
      pickup_city: 'Talisay City',
      pickup_province: 'Cebu',
      pickup_postal_code: '6045',
      pickup_latitude: 10.2447,
      pickup_longitude: 123.8494,
      sells_products: true,
      sells_services: false,
    });
    // Ulrak Pickle Ball Hub seller (owner@cody.inc - user_id 6)
    await ensureSeller({
      id: 4,
      user: sellerUser6,
      store_name: 'Ulrak Pickle Ball Hub',
      store_description:
        'Ulrak Pickle Ball Hub is a premier pickleball facility located inside Anjo World, Belmont One, Minglanilla, Cebu. Featuring two full-size regulation courts with proper lighting and ventilation.',
      contact: '0919 069 2100',
      email: 'ulrak@example.com',
      website: null,
      pickup_address:
        'Ulrak Pickle Ball Hub, Upper Belmont One, South Road, Minglanilla',
      pickup_city: 'Minglanilla',
      pickup_province: 'Cebu',
      pickup_postal_code: '6046',
      pickup_latitude: 10.2356,
      pickup_longitude: 123.7994,
      sells_products: false,
      sells_services: true,
    });
    console.log('✅ Sellers seed completed (ensured 4 seller accounts)');
  }
}
