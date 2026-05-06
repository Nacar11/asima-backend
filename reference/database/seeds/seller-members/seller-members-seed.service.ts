import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerMemberEntity } from '@/seller-members/persistence/entities/seller-member.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerMemberStatusEnum } from '@/seller-members/enums/seller-member-status.enum';

/**
 * Service for seeding seller members
 */
@Injectable()
export class SellerMembersSeedService {
  constructor(
    @InjectRepository(SellerMemberEntity)
    private repository: Repository<SellerMemberEntity>,
    @InjectRepository(SellerEntity)
    private sellerRepository: Repository<SellerEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        id: 1,
      },
    });

    if (!user) {
      console.error('❌ No user found. Cannot proceed to seed seller members.');
      return;
    }

    // Ensure seller_id=3 has members
    const targetSellerId = 3;
    const seller = await this.sellerRepository.findOne({
      where: { id: targetSellerId },
    });

    if (!seller) {
      console.log(
        `⚠️  Seller with ID ${targetSellerId} not found. Skipping seller members seed.`,
      );
      return;
    }

    // Check if seller already has members
    const existingMembersCount = await this.repository.count({
      where: { seller_id: targetSellerId },
    });

    const targetMemberCount = 5; // Create 5 members for seller_id=3

    if (existingMembersCount >= targetMemberCount) {
      console.log(
        `⚠️  Seller ${targetSellerId} already has ${existingMembersCount} members. Skipping seed.`,
      );
      return;
    }

    // Get users that are not already members of this seller and not the seller owner
    const existingMembers = await this.repository.find({
      where: { seller_id: targetSellerId },
      select: ['user_id'],
    });
    const existingMemberUserIds = existingMembers.map((m) => m.user_id);

    const availableUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id != :sellerUserId', { sellerUserId: seller.user_id })
      .andWhere(
        existingMemberUserIds.length > 0
          ? 'user.id NOT IN (:...existingIds)'
          : '1=1',
        existingMemberUserIds.length > 0
          ? { existingIds: existingMemberUserIds }
          : {},
      )
      .take(targetMemberCount)
      .getMany();

    if (availableUsers.length === 0) {
      console.log(
        '⚠️  No available users found. Skipping seller members seed.',
      );
      return;
    }

    const members: Array<{
      seller_id: number;
      user_id: number;
      role: string;
      is_service_provider: boolean;
      max_daily_bookings: number;
      max_concurrent_bookings: number;
      service_capacity_hours: number;
      is_available_for_booking: boolean;
      display_name: string;
      bio: string | null;
      average_rating: number;
      total_reviews: number;
      total_completed_bookings: number;
      status: SellerMemberStatusEnum;
      created_by: UserEntity;
      updated_by: UserEntity;
    }> = [];

    const roles = ['member', 'member', 'member', 'manager', 'member'];
    const bios = [
      'Experienced service provider with excellent customer reviews',
      'Professional and reliable team member',
      'Specialized in home services',
      'Team manager with years of experience',
      'Dedicated service professional',
    ];

    for (let i = 0; i < availableUsers.length && i < targetMemberCount; i++) {
      const userForMember = availableUsers[i];
      members.push({
        seller_id: targetSellerId,
        user_id: userForMember.id,
        role: roles[i] || 'member',
        is_service_provider: true,
        max_daily_bookings: i === 3 ? 10 : 8, // Manager gets more bookings
        max_concurrent_bookings: i === 3 ? 2 : 1,
        service_capacity_hours: 8.0,
        is_available_for_booking: true,
        display_name: `${userForMember.first_name} ${userForMember.last_name}`,
        bio: bios[i] || null,
        average_rating: 0,
        total_reviews: 0,
        total_completed_bookings: 0,
        status: SellerMemberStatusEnum.ACTIVE,
        created_by: user,
        updated_by: user,
      });
    }

    if (members.length > 0) {
      await this.repository.save(
        members.map((member) => this.repository.create(member)),
      );

      console.log(
        `✅ ${members.length} seller members seeded successfully for seller_id=${targetSellerId}`,
      );
    }
  }
}
