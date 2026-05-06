import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { CostCenterEntity } from '@/cost-centers/persistence/entities/cost-center.entity';
import { ISeedService } from '../seed.interface';

@Injectable()
export class UserSeedService implements ISeedService {
  constructor(
    @InjectRepository(CostCenterEntity)
    private costCenterRepository: Repository<CostCenterEntity>,
    @InjectRepository(UserEntity)
    private repository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    // const costCenter = await this.costCenterRepository.findOne({
    //   where: {
    //     status: StatusEnum.ACTIVE,
    //   },
    // });
    type EnsureUserInput = {
      readonly user_id: string;
      readonly first_name: string;
      readonly last_name: string;
      readonly email: string;
      readonly system_admin: boolean;
    };
    const ensureUser = async (input: EnsureUserInput): Promise<void> => {
      const existing = await this.repository.findOne({
        where: {
          email: input.email,
        },
      });
      if (existing) {
        const shouldUpdate =
          existing.user_id !== input.user_id ||
          existing.first_name !== input.first_name ||
          existing.last_name !== input.last_name ||
          existing.system_admin !== input.system_admin;
        if (!shouldUpdate) {
          return;
        }
        await this.repository.save({
          ...existing,
          user_id: input.user_id,
          first_name: input.first_name,
          last_name: input.last_name,
          system_admin: input.system_admin,
        });
        return;
      }
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash('password', salt);
      await this.repository.save(
        this.repository.create({
          user_id: input.user_id,
          first_name: input.first_name,
          last_name: input.last_name,
          email: input.email,
          password,
          salt,
          system_admin: input.system_admin,
          // cost_center: costCenter,
        }),
      );
    };
    const users: EnsureUserInput[] = [
      {
        user_id: '1000000',
        first_name: 'Super',
        last_name: 'Admin',
        email: 'admin@cody.inc',
        system_admin: true,
      },
      {
        user_id: '1000001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@cody.inc',
        system_admin: false,
      },
      {
        user_id: '1000002',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@cody.inc',
        system_admin: false,
      },
      {
        user_id: '1000003',
        first_name: 'Mike',
        last_name: 'Johnson',
        email: 'mike.johnson@cody.inc',
        system_admin: false,
      },
      {
        user_id: '1000004',
        first_name: 'Sarah',
        last_name: 'Williams',
        email: 'sarah.williams@cody.inc',
        system_admin: false,
      },
      // Travajo test users
      {
        user_id: '1000005',
        first_name: 'Store',
        last_name: 'Owner',
        email: 'owner@cody.inc',
        system_admin: true,
      },
      {
        user_id: '1000006',
        first_name: 'Test',
        last_name: 'Customer',
        email: 'customer@cody.inc',
        system_admin: false,
      },
    ];
    for (const seedUser of users) {
      await ensureUser(seedUser);
    }
  }
}
