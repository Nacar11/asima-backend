import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDetailEntity } from '@/user-details/persistence/entities/user-detail.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ISeedService } from '../seed.interface';

@Injectable()
export class UserDetailSeedService implements ISeedService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(UserDetailEntity)
    private userDetailRepository: Repository<UserDetailEntity>,
  ) {}

  async run(): Promise<void> {
    const seedEmails = [
      'admin@cody.inc',
      'john.doe@cody.inc',
      'jane.smith@cody.inc',
      'mike.johnson@cody.inc',
      'sarah.williams@cody.inc',
    ];
    const users = await this.userRepository.find();
    const usersByEmail = new Map<string, UserEntity>();
    for (const user of users) {
      usersByEmail.set(user.email.toLowerCase(), user);
    }
    const seedUsers: UserEntity[] = [];
    for (const email of seedEmails) {
      const user = usersByEmail.get(email.toLowerCase());
      if (!user) {
        console.error(
          '❌ Missing required users. Cannot proceed to seed user details. Please run user seeder first.',
        );
        return;
      }
      seedUsers.push(user);
    }
    const actor = seedUsers[0];
    const seedUserDetails = [
      {
        email: 'admin@cody.inc',
        username: 'superadmin',
        gender: 'PreferNotToSay',
        dateOfBirth: new Date('1990-01-01'),
        bio: 'Super admin account.',
        phone: '+12345678901',
        address: 'Admin Address',
        timezone: 'UTC',
      },
      {
        email: 'john.doe@cody.inc',
        username: 'johndoe',
        gender: 'Male',
        dateOfBirth: new Date('1991-01-01'),
        bio: 'Seller account.',
        phone: '+12345678902',
        address: 'Cebu City, Cebu, Philippines',
        timezone: 'Asia/Manila',
      },
      {
        email: 'jane.smith@cody.inc',
        username: 'janesmith',
        gender: 'Female',
        dateOfBirth: new Date('1990-07-22'),
        bio: 'Buyer account.',
        phone: '+12345678903',
        address: 'Los Angeles, CA, USA',
        timezone: 'America/Los_Angeles',
      },
      {
        email: 'mike.johnson@cody.inc',
        username: 'mikejohnson',
        gender: 'Male',
        dateOfBirth: new Date('1988-11-08'),
        bio: 'Buyer account.',
        phone: '+12345678904',
        address: 'London, UK',
        timezone: 'Europe/London',
      },
      {
        email: 'sarah.williams@cody.inc',
        username: 'sarahwilliams',
        gender: 'Female',
        dateOfBirth: new Date('1992-05-30'),
        bio: 'Buyer account.',
        phone: '+12345678905',
        address: 'Tokyo, Japan',
        timezone: 'Asia/Tokyo',
      },
    ];
    const detailsByEmail = new Map(
      seedUserDetails.map((d) => [d.email.toLowerCase(), d]),
    );
    let insertedCount = 0;
    let updatedCount = 0;
    for (const user of seedUsers) {
      const next = detailsByEmail.get(user.email.toLowerCase());
      if (!next) {
        continue;
      }
      const existing = await this.userDetailRepository.findOne({
        where: { user_id: user.id },
      });
      if (!existing) {
        await this.userDetailRepository.save(
          this.userDetailRepository.create({
            user_id: user.id,
            username: next.username,
            gender: next.gender,
            date_of_birth: next.dateOfBirth,
            bio: next.bio,
            profile_picture: null,
            profile_picture_path: null,
            phone: next.phone,
            address: next.address,
            phone_verified_at: null,
            email_verified_at: new Date(),
            timezone: next.timezone,
            locale: 'en_US',
            notification_preferences: this.getNotificationPreferencesForUser(0),
            created_by: actor,
            updated_by: actor,
          }),
        );
        insertedCount++;
        continue;
      }
      const shouldUpdate =
        existing.username !== next.username ||
        existing.gender !== next.gender ||
        existing.bio !== next.bio ||
        (existing.phone ?? null) !== next.phone ||
        (existing.address ?? null) !== next.address ||
        existing.timezone !== next.timezone;
      if (!shouldUpdate) {
        continue;
      }
      await this.userDetailRepository.save({
        ...existing,
        username: next.username,
        gender: next.gender,
        date_of_birth: next.dateOfBirth,
        bio: next.bio,
        phone: next.phone,
        address: next.address,
        timezone: next.timezone,
        updated_by: actor,
      });
      updatedCount++;
    }
    console.log(
      `✅ User details seed completed (${insertedCount} inserted, ${updatedCount} updated, ${seedUsers.length - insertedCount - updatedCount} unchanged)`,
    );
  }

  private getNotificationPreferencesForUser(
    index: number,
  ): Record<string, boolean> {
    const preferences = [
      {
        email_notifications: true,
        sms_notifications: true,
        push_notifications: false,
        marketing_emails: true,
      },
      {
        email_notifications: false,
        sms_notifications: true,
        push_notifications: true,
        marketing_emails: false,
      },
      {
        email_notifications: true,
        sms_notifications: false,
        push_notifications: false,
        marketing_emails: false,
      },
    ];
    return (
      preferences[index] || {
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        marketing_emails: false,
      }
    );
  }
}
