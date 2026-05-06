import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ISeedService } from '../seed.interface';

@Injectable()
export class ProductionUserSeedService implements ISeedService {
  constructor(
    @InjectRepository(UserEntity)
    private repository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
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
      const password = await bcrypt.hash('pWFX75iNGb0', salt);
      await this.repository.save(
        this.repository.create({
          user_id: input.user_id,
          first_name: input.first_name,
          last_name: input.last_name,
          email: input.email,
          password,
          salt,
          system_admin: input.system_admin,
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
    ];
    for (const seedUser of users) {
      await ensureUser(seedUser);
    }
  }
}
