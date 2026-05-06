import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerMemberServiceEntity } from '@/seller-member-services/persistence/entities/seller-member-service.entity';
import { SellerMemberEntity } from '@/seller-members/persistence/entities/seller-member.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ProficiencyLevelEnum } from '@/seller-member-services/enums/proficiency-level.enum';

/**
 * Service for seeding seller member services
 */
@Injectable()
export class SellerMemberServicesSeedService {
  constructor(
    @InjectRepository(SellerMemberServiceEntity)
    private repository: Repository<SellerMemberServiceEntity>,
    @InjectRepository(SellerMemberEntity)
    private sellerMemberRepository: Repository<SellerMemberEntity>,
    @InjectRepository(ServiceEntity)
    private serviceRepository: Repository<ServiceEntity>,
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
          '❌ No user found. Cannot proceed to seed seller member services.',
        );
        return;
      }

      const members = await this.sellerMemberRepository.find({ take: 3 });
      const services = await this.serviceRepository.find({ take: 5 });

      if (members.length === 0 || services.length === 0) {
        console.log(
          '⚠️  No seller members or services found. Skipping seller member services seed.',
        );
        return;
      }

      const memberServices: Array<{
        seller_member_id: number;
        service_id: number;
        proficiency_level: ProficiencyLevelEnum;
        is_primary: boolean;
        created_by: UserEntity;
        updated_by: UserEntity;
      }> = [];

      // Assign services to members
      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        // Assign 1-2 services per member
        const servicesToAssign = services.slice(i, i + 2);
        for (let j = 0; j < servicesToAssign.length; j++) {
          memberServices.push({
            seller_member_id: member.id,
            service_id: servicesToAssign[j].id,
            proficiency_level:
              j === 0
                ? ProficiencyLevelEnum.EXPERT
                : ProficiencyLevelEnum.STANDARD,
            is_primary: j === 0,
            created_by: user,
            updated_by: user,
          });
        }
      }

      await this.repository.save(
        memberServices.map((ms) => this.repository.create(ms)),
      );

      console.log(
        `✅ ${memberServices.length} seller member services seeded successfully`,
      );
    }
  }
}
