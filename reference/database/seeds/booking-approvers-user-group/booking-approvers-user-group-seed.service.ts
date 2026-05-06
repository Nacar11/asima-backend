import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISeedService } from '../seed.interface';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { StatusEnum } from '@/user-groups/user-groups.enum';

@Injectable()
export class BookingApproversUserGroupSeedService implements ISeedService {
  private static readonly GROUP_NAME = 'Booking Approvers';
  private static readonly DESCRIPTION =
    'Receives booking payment approval notifications';

  constructor(
    @InjectRepository(UserGroupEntity)
    private readonly userGroupRepository: Repository<UserGroupEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SellerEntity)
    private readonly sellerRepository: Repository<SellerEntity>,
  ) {}

  async run() {
    console.log('🌱 Checking seller-scoped Booking Approvers groups...');

    const adminUser = await this.userRepository.findOne({
      where: { system_admin: true },
    });

    if (!adminUser) {
      console.error(
        '❌ No admin user. Cannot proceed to seed Booking Approvers groups.',
      );
      return;
    }

    const sellers = await this.sellerRepository.find({
      select: ['id'],
    });
    const sellerIds = sellers.map((seller) => seller.id);

    if (sellerIds.length === 0) {
      console.log(
        'ℹ️ No sellers found. Skipping seller-scoped Booking Approvers seeding.',
      );
      return;
    }

    const existingSellerApproverGroups = await this.userGroupRepository.find({
      select: ['seller_id'],
      where: {
        group_name: BookingApproversUserGroupSeedService.GROUP_NAME,
      },
    });

    const seededSellerIds = new Set(
      existingSellerApproverGroups
        .map((group) => group.seller_id)
        .filter((sellerId): sellerId is number => typeof sellerId === 'number'),
    );

    const missingSellerIds = sellerIds.filter(
      (sellerId) => !seededSellerIds.has(sellerId),
    );

    if (missingSellerIds.length === 0) {
      console.log('✅ Seller Booking Approvers groups already seeded.');
      return;
    }

    console.log(
      `🌱 Seeding Booking Approvers group for ${missingSellerIds.length} seller(s)...`,
    );

    const sellerGroupEntities: UserGroupEntity[] = missingSellerIds.map(
      (sellerId) =>
        ({
          seller_id: sellerId,
          group_name: BookingApproversUserGroupSeedService.GROUP_NAME,
          description: BookingApproversUserGroupSeedService.DESCRIPTION,
          status: StatusEnum.ACTIVE,
          created_by: adminUser,
          updated_by: adminUser,
        }) as UserGroupEntity,
    );

    await this.userGroupRepository.save(sellerGroupEntities);
    console.log(
      `✅ Successfully seeded ${sellerGroupEntities.length} seller Booking Approvers group(s).`,
    );
  }

  async down(): Promise<void> {
    await this.userGroupRepository.delete({
      group_name: BookingApproversUserGroupSeedService.GROUP_NAME,
    } as any);
  }
}
