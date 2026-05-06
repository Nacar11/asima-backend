import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DivisionEntity } from '@/divisions/persistence/entities/division.entity';
import { Repository } from 'typeorm';
import { StatusEnum } from '@/utils/enums/status-enum';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Injectable()
export class DivisionSeedService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(DivisionEntity)
    private repository: Repository<DivisionEntity>,
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

      const divisions = [
        {
          division_code: '00',
          division_name: 'Division A',
          division_head: adminUser,
          status: StatusEnum.ACTIVE,
          created_by: adminUser,
          updated_by: adminUser,
        },
      ];
      await this.repository.save(divisions);
    }
  }
}
