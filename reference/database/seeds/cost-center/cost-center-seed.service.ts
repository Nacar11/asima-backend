import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CostCenterEntity } from '@/cost-centers/persistence/entities/cost-center.entity';
import { Repository } from 'typeorm';
import { DivisionEntity } from '@/divisions/persistence/entities/division.entity';
import { DepartmentEntity } from '@/departments/persistence/entities/department.entity';
import { SectionEntity } from '@/sections/persistence/entities/section.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
// import { SubSectionEntity } from '@/sub-sections/persistence/entities/sub-section.entity';

@Injectable()
export class CostCenterSeedService {
  constructor(
    @InjectRepository(SectionEntity)
    private sectionRepository: Repository<SectionEntity>,
    // @InjectRepository(SubSectionEntity)
    // private subSectionRepository: Repository<SubSectionEntity>,
    @InjectRepository(DepartmentEntity)
    private departmentRepository: Repository<DepartmentEntity>,
    @InjectRepository(DivisionEntity)
    private divisionRepository: Repository<DivisionEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(CostCenterEntity)
    private repository: Repository<CostCenterEntity>,
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

      const divisions = await this.divisionRepository.find();
      const departments = await this.departmentRepository.find();
      // const subSections = await this.subSectionRepository.find();
      const sections = await this.sectionRepository.find();

      const division = divisions[0];
      const department = departments[0];
      const section = sections[0];

      const costCenter = {
        cost_center_code: [
          division.division_code,
          department.department_code,
          section.section_code,
        ].join(''),
        division: division,
        department: department,
        section: section,
        created_by: adminUser,
        updated_by: adminUser,
      };

      await this.repository.save(this.repository.create(costCenter));
    }
  }
}
