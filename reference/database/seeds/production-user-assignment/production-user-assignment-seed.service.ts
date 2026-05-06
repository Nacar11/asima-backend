import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISeedService } from '../seed.interface';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { StatusEnum } from '@/user-assignments/user-assignments.enum';

const PRODUCTION_ASSIGNMENTS: Record<string, string> = {
  'admin@cody.inc': 'Admin',
  'mark_saren+dpofoods@cody.inc': 'Store Owner',
};

@Injectable()
export class ProductionUserAssignmentSeedService implements ISeedService {
  constructor(
    @InjectRepository(UserAssignmentEntity)
    private readonly userAssignmentRepository: Repository<UserAssignmentEntity>,
    @InjectRepository(UserGroupEntity)
    private readonly userGroupRepository: Repository<UserGroupEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async run() {
    console.log('🌱 Running Production User Assignment Seed...');

    // Get admin user for audit fields (assuming admin@cody.inc is the admin)
    // We can fetch by email since we know we are seeding it.
    const adminUser = await this.userRepository.findOne({
      where: { email: 'admin@cody.inc' },
    });

    if (!adminUser) {
      console.error(
        '❌ Admin user (admin@cody.inc) not found. Cannot proceed to seed user assignments.',
      );
      return;
    }

    // Get all groups
    const groups = await this.userGroupRepository.find();
    const groupMap = new Map(groups.map((g) => [g.group_name, g]));

    const assignmentsToCreate: Partial<UserAssignmentEntity>[] = [];

    for (const [email, groupName] of Object.entries(PRODUCTION_ASSIGNMENTS)) {
      const user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        console.warn(`⚠️ User "${email}" not found. Skipping assignment.`);
        continue;
      }

      const group = groupMap.get(groupName);
      if (!group) {
        console.warn(
          `⚠️ Group "${groupName}" not found for user ${email}. Skipping.`,
        );
        continue;
      }

      // Check if assignment already exists
      const existingAssignment = await this.userAssignmentRepository.findOne({
        where: {
          user: { id: user.id },
          group: { id: group.id },
        },
      });

      if (existingAssignment) {
        // console.log(`  ℹ️ Assignment for ${email} to ${groupName} already exists.`);
        continue;
      }

      assignmentsToCreate.push({
        user,
        group,
        status: StatusEnum.ACTIVE,
        created_by: adminUser,
        updated_by: adminUser,
      });

      console.log(`  📌 Assigning ${email} → ${groupName}`);
    }

    if (assignmentsToCreate.length === 0) {
      console.log(
        '✅ Skipping Production User Assignment seeding - no new assignments needed',
      );
      return;
    }

    console.log(
      `🌱 Seeding ${assignmentsToCreate.length} Production User Assignment(s)...`,
    );

    await this.userAssignmentRepository.save(assignmentsToCreate);
    console.log(
      `✅ Successfully seeded ${assignmentsToCreate.length} Production User Assignment(s).`,
    );
  }
}
