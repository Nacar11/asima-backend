import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SectionEntity } from '@/sections/persistence/entities/section.entity';
import { Repository } from 'typeorm';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Injectable()
export class SectionSeedService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(SectionEntity)
    private repository: Repository<SectionEntity>,
  ) {}

  async run() {
    const count = await this.repository.count();

    if (!count) {
      const adminUser = await this.userRepository.findOne({
        where: {
          system_admin: true,
        },
      });

      if (!adminUser) {
        console.error('❌ No admin user. Cannot proceed to seed menu code.');
        return;
      }

      const sections = [
        {
          section_code: '00',
          section_name: 'Section A',
          section_head: adminUser,
          created_by: adminUser,
          updated_by: adminUser,
        },
        {
          section_code: '01',
          section_name: 'Section B',
          section_head: adminUser,
          created_by: adminUser,
          updated_by: adminUser,
        },
      ];
      await this.repository.save(sections);
    }
  }
}
