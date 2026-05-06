import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DepartmentEntity } from '@/departments/persistence/entities/department.entity';
import { Repository } from 'typeorm';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Injectable()
export class DepartmentSeedService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(DepartmentEntity)
    private repository: Repository<DepartmentEntity>,
  ) {}

  async run() {
    const count = await this.repository.count();

    const adminUser = await this.userRepository.findOne({
      where: {
        system_admin: true,
      },
    });

    if (!adminUser) {
      console.error('❌ No admin user. Cannot proceed to seed menu code.');
      return;
    }

    const departments = [
      {
        department_code: '00',
        department_name: 'Human Resources Department',
        department_head: adminUser,
        created_by: adminUser,
        updated_by: adminUser,
      },
      {
        department_code: '01',
        department_name: 'Accounting',
        department_head: adminUser,
        created_by: adminUser,
        updated_by: adminUser,
      },
      {
        department_code: '02',
        department_name: 'Administration',
        department_head: adminUser,
        created_by: adminUser,
        updated_by: adminUser,
      },
      {
        department_code: '03',
        department_name: 'Sales',
        department_head: adminUser,
        created_by: adminUser,
        updated_by: adminUser,
      },
      {
        department_code: '04',
        department_name: 'Operations',
        department_head: adminUser,
        created_by: adminUser,
        updated_by: adminUser,
      },
    ];

    if (!count) {
      await this.repository.save(departments);
    }
  }
}
