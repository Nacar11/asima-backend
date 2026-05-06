import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISeedService } from '../seed.interface';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { StatusEnum } from '@/user-assignments/user-assignments.enum';

// Specific user-to-group mappings for seed users
const SEED_USER_ASSIGNMENTS: Record<string, string> = {
  'admin@cody.inc': 'Admin',
  'john.doe@cody.inc': 'Store Owner',
  'jane.smith@cody.inc': 'Store Owner',
  'customer@cody.inc': 'Customer',
  'mark_saren+dpofoods@cody.inc': 'Store Owner',
};

@Injectable()
export class UserAssignmentSeedService implements ISeedService {
  constructor(
    @InjectRepository(UserAssignmentEntity)
    private readonly userAssignmentRepository: Repository<UserAssignmentEntity>,
    @InjectRepository(UserGroupEntity)
    private readonly userGroupRepository: Repository<UserGroupEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async run() {
    console.log('🌱 Checking user assignments...');

    // Get admin user for audit fields
    const adminUser = await this.userRepository.findOne({
      where: { system_admin: true },
    });

    if (!adminUser) {
      console.error(
        '❌ No admin user. Cannot proceed to seed user assignments.',
      );
      return;
    }

    // Get all groups
    const groups = await this.userGroupRepository.find();
    const groupMap = new Map(groups.map((g) => [g.group_name, g]));

    // Get existing assignments
    const existingAssignments = await this.userAssignmentRepository.find({
      relations: ['user', 'group'],
    });
    const existingAssignmentKeys = new Set(
      existingAssignments.map((a) => `${a.user.id}-${a.group.id}`),
    );

    // Get users who need assignments (those without any assignments)
    const usersWithAssignments = new Set(
      existingAssignments.map((a) => a.user.id),
    );

    // Get all users
    const allUsers = await this.userRepository.find();
    const usersNeedingAssignments = allUsers.filter(
      (user) => !usersWithAssignments.has(user.id),
    );

    if (usersNeedingAssignments.length === 0) {
      console.log(
        '✅ Skipping User Assignment seeding - all users have assignments',
      );
      return;
    }

    const assignmentsToCreate: Partial<UserAssignmentEntity>[] = [];

    for (const user of usersNeedingAssignments) {
      // Determine the group based on:
      // 1. Specific seed user mappings
      // 2. system_admin flag
      // 3. Default to Customer
      let groupName: string;

      if (SEED_USER_ASSIGNMENTS[user.email]) {
        // Use specific mapping for seed users
        groupName = SEED_USER_ASSIGNMENTS[user.email];
      } else if (user.system_admin) {
        groupName = 'Admin';
      } else {
        groupName = 'Customer';
      }

      const group = groupMap.get(groupName);
      if (!group) {
        console.log(
          `⚠️ Group "${groupName}" not found for user ${user.email}. Skipping.`,
        );
        continue;
      }

      // Check if assignment already exists
      const key = `${user.id}-${group.id}`;
      if (existingAssignmentKeys.has(key)) {
        continue;
      }

      assignmentsToCreate.push({
        user,
        group,
        status: StatusEnum.ACTIVE,
        created_by: adminUser,
        updated_by: adminUser,
      });

      console.log(`  📌 Assigning ${user.email} → ${groupName}`);
    }

    if (assignmentsToCreate.length === 0) {
      console.log(
        '✅ Skipping User Assignment seeding - no new assignments needed',
      );
      return;
    }

    console.log(
      `🌱 Seeding ${assignmentsToCreate.length} User Assignment(s)...`,
    );

    await this.userAssignmentRepository.save(assignmentsToCreate);
    console.log(
      `✅ Successfully seeded ${assignmentsToCreate.length} User Assignment(s).`,
    );
  }
}
