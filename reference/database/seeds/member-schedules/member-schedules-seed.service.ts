import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberScheduleEntity } from '@/member-schedules/persistence/entities/member-schedule.entity';
import { SellerMemberEntity } from '@/seller-members/persistence/entities/seller-member.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Service for seeding member schedules
 */
@Injectable()
export class MemberSchedulesSeedService {
  constructor(
    @InjectRepository(MemberScheduleEntity)
    private repository: Repository<MemberScheduleEntity>,
    @InjectRepository(SellerMemberEntity)
    private sellerMemberRepository: Repository<SellerMemberEntity>,
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
          '❌ No user found. Cannot proceed to seed member schedules.',
        );
        return;
      }

      const members = await this.sellerMemberRepository.find({ take: 3 });

      if (members.length === 0) {
        console.log(
          '⚠️  No seller members found. Skipping member schedules seed.',
        );
        return;
      }

      const schedules: Array<{
        seller_member_id: number;
        day_of_week: number;
        is_available: boolean;
        start_time: string;
        end_time: string;
        break_start: string;
        break_end: string;
        created_by: UserEntity;
        updated_by: UserEntity;
      }> = [];

      // Create schedules for each member (Monday to Friday, 9 AM to 5 PM)
      for (const member of members) {
        for (let day = 1; day <= 5; day++) {
          // 1 = Monday, 5 = Friday
          schedules.push({
            seller_member_id: member.id,
            day_of_week: day,
            is_available: true,
            start_time: '09:00:00',
            end_time: '17:00:00',
            break_start: '12:00:00',
            break_end: '13:00:00',
            created_by: user,
            updated_by: user,
          });
        }
      }

      await this.repository.save(
        schedules.map((schedule) => this.repository.create(schedule)),
      );

      console.log(
        `✅ ${schedules.length} member schedules seeded successfully`,
      );
    }
  }
}
