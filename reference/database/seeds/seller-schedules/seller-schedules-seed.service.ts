import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerScheduleEntity } from '@/seller-schedules/persistence/entities/seller-schedule.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Service for seeding seller schedules
 */
@Injectable()
export class SellerSchedulesSeedService {
  constructor(
    @InjectRepository(SellerScheduleEntity)
    private repository: Repository<SellerScheduleEntity>,
    @InjectRepository(SellerEntity)
    private sellerRepository: Repository<SellerEntity>,
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
          '❌ No user found. Cannot proceed to seed seller schedules.',
        );
        return;
      }

      const sellers = await this.sellerRepository.find({ take: 3 });

      if (sellers.length === 0) {
        console.log('⚠️  No sellers found. Skipping seller schedules seed.');
        return;
      }

      const schedules: Array<{
        seller_id: number;
        day_of_week: number;
        status: string;
        start_time: string;
        end_time: string;
        break_start: string;
        break_end: string;
        created_by: UserEntity;
        updated_by: UserEntity;
      }> = [];

      // Create schedules for each seller (Monday to Friday, 9 AM to 5 PM)
      for (const seller of sellers) {
        for (let day = 1; day <= 5; day++) {
          // 1 = Monday, 5 = Friday
          schedules.push({
            seller_id: seller.id,
            day_of_week: day,
            status: 'Active',
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
        `✅ ${schedules.length} seller schedules seeded successfully`,
      );
    }
  }
}
