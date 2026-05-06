import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberScheduleEntity } from '@/member-schedules/persistence/entities/member-schedule.entity';
import { MemberSchedulesSeedService } from '@/database/seeds/member-schedules/member-schedules-seed.service';
import { SellerMemberEntity } from '@/seller-members/persistence/entities/seller-member.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for member schedules
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      MemberScheduleEntity,
      SellerMemberEntity,
      UserEntity,
    ]),
  ],
  providers: [MemberSchedulesSeedService],
  exports: [MemberSchedulesSeedService],
})
export class MemberSchedulesSeedModule {}
