import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubSectionEntity } from '@/sub-sections/persistence/entities/sub-section.entity';
import { Repository } from 'typeorm';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Injectable()
export class SubSectionSeedService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(SubSectionEntity)
    private repository: Repository<SubSectionEntity>,
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

      const subsections = [
        {
          sub_section_code: '00',
          sub_section_name: 'Section A',
          sub_section_head: adminUser,
          created_by: adminUser,
          updated_by: adminUser,
        },
        {
          sub_section_code: '01',
          sub_section_name: 'Section B',
          sub_section_head: adminUser,
          created_by: adminUser,
          updated_by: adminUser,
        },
      ];
      await this.repository.save(subsections);
    }
  }
}
