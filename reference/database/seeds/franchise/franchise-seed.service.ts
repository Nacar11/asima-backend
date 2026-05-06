import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISeedService } from '../seed.interface';
import { Repository } from 'typeorm';
import { FranchiseEntity } from '@/franchises/persistence/entities/franchise.entity';
import { FranchiseStatusEventEntity } from '@/franchises/persistence/entities/franchise-status-event.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { FranchiseStatusEnum } from '@/franchises/domain/franchise-status.enum';

interface FranchiseSeedData {
  name: string;
  owner_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  status: FranchiseStatusEnum;
  notes?: string;
}

@Injectable()
export class FranchiseSeedService implements ISeedService {
  private readonly franchiseData: FranchiseSeedData[] = [
    {
      name: 'Manila Central Store',
      owner_name: 'Juan Dela Cruz',
      email: 'manila.central@ekumpra.ph',
      phone: '+639171234567',
      address_line1: '123 Rizal Avenue',
      address_line2: 'Unit 101',
      city: 'Manila',
      state_province: 'Metro Manila',
      postal_code: '1000',
      country: 'Philippines',
      status: FranchiseStatusEnum.ACTIVE,
      notes: 'Flagship store in Manila',
    },
    {
      name: 'Cebu Main Branch',
      owner_name: 'Maria Santos',
      email: 'cebu.main@ekumpra.ph',
      phone: '+639181234567',
      address_line1: '456 Colon Street',
      city: 'Cebu City',
      state_province: 'Cebu',
      postal_code: '6000',
      country: 'Philippines',
      status: FranchiseStatusEnum.ACTIVE,
      notes: 'Primary branch for Visayas region',
    },
    {
      name: 'Davao South Hub',
      owner_name: 'Pedro Reyes',
      email: 'davao.south@ekumpra.ph',
      phone: '+639191234567',
      address_line1: '789 Quirino Avenue',
      city: 'Davao City',
      state_province: 'Davao del Sur',
      postal_code: '8000',
      country: 'Philippines',
      status: FranchiseStatusEnum.ACTIVE,
      notes: 'Main hub for Mindanao',
    },
    {
      name: 'Quezon City Express',
      owner_name: 'Ana Garcia',
      email: 'qc.express@ekumpra.ph',
      phone: '+639201234567',
      address_line1: '321 Commonwealth Avenue',
      address_line2: 'Floor 2',
      city: 'Quezon City',
      state_province: 'Metro Manila',
      postal_code: '1100',
      country: 'Philippines',
      status: FranchiseStatusEnum.SCREENING,
      notes: 'New applicant, under review',
    },
    {
      name: 'Makati Business Center',
      owner_name: 'Roberto Lim',
      email: 'makati.bc@ekumpra.ph',
      phone: '+639211234567',
      address_line1: '555 Ayala Avenue',
      address_line2: 'Suite 1200',
      city: 'Makati City',
      state_province: 'Metro Manila',
      postal_code: '1200',
      country: 'Philippines',
      status: FranchiseStatusEnum.SCREENING,
    },
    {
      name: 'Iloilo Plaza Store',
      owner_name: 'Carmen Villanueva',
      email: 'iloilo.plaza@ekumpra.ph',
      phone: '+639221234567',
      address_line1: '888 JM Basa Street',
      city: 'Iloilo City',
      state_province: 'Iloilo',
      postal_code: '5000',
      country: 'Philippines',
      status: FranchiseStatusEnum.INACTIVE,
      notes: 'Temporarily closed for renovation',
    },
    {
      name: 'Baguio Highland Shop',
      owner_name: 'Carlos Mendoza',
      email: 'baguio.highland@ekumpra.ph',
      phone: '+639231234567',
      address_line1: '999 Session Road',
      city: 'Baguio City',
      state_province: 'Benguet',
      postal_code: '2600',
      country: 'Philippines',
      status: FranchiseStatusEnum.REJECTED,
      notes: 'Application rejected - incomplete documents',
    },
  ];

  constructor(
    @InjectRepository(FranchiseEntity)
    private readonly franchiseRepository: Repository<FranchiseEntity>,
    @InjectRepository(FranchiseStatusEventEntity)
    private readonly statusEventRepository: Repository<FranchiseStatusEventEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.franchiseRepository.count();
    if (count) {
      console.log('Franchises already exist, skipping seed');
      return;
    }

    const adminUser = await this.userRepository.findOne({
      where: { id: 1 },
    });

    if (!adminUser) {
      console.error('No admin user found (id=1). Cannot seed franchises.');
      return;
    }

    for (const data of this.franchiseData) {
      const isActive = data.status === FranchiseStatusEnum.ACTIVE;

      const franchise = this.franchiseRepository.create({
        ...data,
        onboarded_at: isActive ? new Date() : null,
        created_by: adminUser,
        updated_by: adminUser,
      });

      const savedFranchise = await this.franchiseRepository.save(franchise);

      // Create initial status event
      const statusEvent = this.statusEventRepository.create({
        franchise_id: savedFranchise.id,
        previous_status: null,
        new_status: savedFranchise.status,
        description: 'Franchise created (seeded)',
        created_by: adminUser,
      });
      await this.statusEventRepository.save(statusEvent);
    }

    console.log(
      `Franchises seeded successfully (${this.franchiseData.length} franchises created)`,
    );
  }
}
