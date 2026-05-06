import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISeedService } from '../seed.interface';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { StatusEnum } from '@/user-groups/user-groups.enum';

interface UserGroupSeed {
  group_name: string;
  description: string;
}

@Injectable()
export class UserGroupSeedService implements ISeedService {
  constructor(
    @InjectRepository(UserGroupEntity)
    private readonly userGroupRepository: Repository<UserGroupEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async run() {
    console.log('🌱 Checking user groups...');

    const userGroups: UserGroupSeed[] = [
      {
        group_name: 'Admin',
        description: 'Full system access',
      },
      {
        group_name: 'Store Owner',
        description: 'Sell products, services, manage team',
      },
      {
        group_name: 'Store Member',
        description: 'Deliver services, manage tasks',
      },
      {
        group_name: 'Customer',
        description: 'Browse, purchase, track orders',
      },
    ];
    // Get admin user for audit fields
    const adminUser = await this.userRepository.findOne({
      where: { system_admin: true },
    });

    if (!adminUser) {
      console.error('❌ No admin user. Cannot proceed to seed user groups.');
      return;
    }

    let seededCount = 0;

    // ==================== Seed Global (seller_id = null) Groups ====================
    const existingGlobalGroups = await this.userGroupRepository.find({
      select: ['group_name'],
      where: { seller_id: null as any },
    });
    const existingGlobalGroupNames = new Set(
      existingGlobalGroups.map((g) => g.group_name),
    );

    const missingGlobalGroups = userGroups.filter(
      (group) => !existingGlobalGroupNames.has(group.group_name),
    );

    if (missingGlobalGroups.length > 0) {
      console.log(
        `🌱 Seeding ${missingGlobalGroups.length} global User Group(s)...`,
      );
      const globalGroupEntities: UserGroupEntity[] = missingGlobalGroups.map(
        (group) =>
          ({
            seller_id: null, // Global/admin groups
            group_name: group.group_name,
            description: group.description,
            status: StatusEnum.ACTIVE,
            created_by: adminUser,
            updated_by: adminUser,
          }) as UserGroupEntity,
      );
      await this.userGroupRepository.save(globalGroupEntities);
      seededCount += globalGroupEntities.length;
      console.log(
        `✅ Successfully seeded ${globalGroupEntities.length} global User Group(s).`,
      );
    } else {
      console.log('✅ Global user groups already seeded.');
    }

    if (seededCount === 0) {
      console.log(
        '✅ Skipping User Group seeding - all required groups already exist.',
      );
    } else {
      console.log(
        `✅ User Group seeding completed. Total new groups: ${seededCount}.`,
      );
    }
  }
}
