import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISeedService } from '../seed.interface';
import { Repository } from 'typeorm';
import { BankEntity } from '@/banks/persistence/entities/bank.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Service for seeding banks master data
 */
@Injectable()
export class BankSeedService implements ISeedService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(BankEntity)
    private repository: Repository<BankEntity>,
  ) {}

  async run(): Promise<void> {
    const adminUser = await this.userRepository.findOne({ where: { id: 1 } });
    if (!adminUser) {
      console.error('❌ Admin user not found. Cannot seed banks.');
      return;
    }
    type BankInput = {
      readonly bank_code: string;
      readonly bank_name: string;
      readonly logo_url?: string | null;
      readonly display_order: number;
    };
    const ensureBank = async (
      input: BankInput,
      createdBy: UserEntity,
    ): Promise<BankEntity | null> => {
      const existing = await this.repository.findOne({
        where: { bank_code: input.bank_code },
      });
      if (existing) {
        return existing;
      }
      return this.repository.save(
        this.repository.create({
          bank_code: input.bank_code,
          bank_name: input.bank_name,
          logo_url: input.logo_url ?? null,
          is_active: true,
          display_order: input.display_order,
          created_by: createdBy,
          updated_by: createdBy,
        }),
      );
    };
    const banks: BankInput[] = [
      // Top/Popular Banks (display_order 1-5)
      {
        bank_code: 'MARIBANK',
        bank_name: 'MariBank Philippines, Inc.',
        display_order: 1,
      },
      {
        bank_code: 'BPI',
        bank_name: 'Bank of the Philippine Islands (BPI)',
        display_order: 2,
      },
      {
        bank_code: 'UBP',
        bank_name: 'Union Bank of the Philippines (Unionbank)',
        display_order: 3,
      },
      {
        bank_code: 'BDO',
        bank_name: 'Banco de Oro Bank (BDO)',
        display_order: 4,
      },
      {
        bank_code: 'MBT',
        bank_name: 'Metropolitan Bank and Trust Company (Metrobank)',
        display_order: 5,
      },
      // Other Banks (alphabetical order, display_order 10+)
      {
        bank_code: 'AUB',
        bank_name: 'Asia United Bank (AUB)',
        display_order: 10,
      },
      {
        bank_code: 'BOA',
        bank_name: 'Bank of America',
        display_order: 11,
      },
      {
        bank_code: 'BOC',
        bank_name: 'Bank of Commerce',
        display_order: 12,
      },
      {
        bank_code: 'CTBC',
        bank_name: 'CTBC Bank',
        display_order: 13,
      },
      {
        bank_code: 'CBC',
        bank_name: 'China Banking Corporation (Chinabank)',
        display_order: 14,
      },
      {
        bank_code: 'CBS',
        bank_name: 'Chinabank Savings',
        display_order: 15,
      },
      {
        bank_code: 'CITI',
        bank_name: 'Citibank',
        display_order: 16,
      },
      {
        bank_code: 'DB',
        bank_name: 'Deutsche Bank',
        display_order: 17,
      },
      {
        bank_code: 'DBP',
        bank_name: 'Development Bank of the Philippines (DBP)',
        display_order: 18,
      },
      {
        bank_code: 'EWB',
        bank_name: 'East West Bank',
        display_order: 19,
      },
      {
        bank_code: 'HSBC',
        bank_name: 'Hongkong and Shanghai Banking Corporation (HSBC)',
        display_order: 20,
      },
      {
        bank_code: 'ICBC',
        bank_name: 'ICBC Manila',
        display_order: 21,
      },
      {
        bank_code: 'JPMC',
        bank_name: 'JPMorgan Chase Bank, N.A.',
        display_order: 22,
      },
      {
        bank_code: 'LBP',
        bank_name: 'Land Bank of the Philippines (Landbank)',
        display_order: 23,
      },
      {
        bank_code: 'MAYBANK',
        bank_name: 'Maybank Philippines',
        display_order: 24,
      },
      {
        bank_code: 'NETBANK',
        bank_name: 'Netbank (A Rural Bank), Inc.',
        display_order: 25,
      },
      {
        bank_code: 'PBCOM',
        bank_name: 'Philippine Bank of Communications (PBCom)',
        display_order: 26,
      },
      {
        bank_code: 'PNB',
        bank_name: 'Philippine National Bank (PNB)',
        display_order: 27,
      },
      {
        bank_code: 'PSBANK',
        bank_name: 'Philippine Savings Bank (PSBank)',
        display_order: 28,
      },
      {
        bank_code: 'PHILTRUST',
        bank_name: 'Philippine Trust Company (Philtrust Bank)',
        display_order: 29,
      },
      {
        bank_code: 'PVB',
        bank_name: 'Philippine Veterans Bank (Veterans Bank)',
        display_order: 30,
      },
      {
        bank_code: 'RCBC',
        bank_name: 'Rizal Commercial Banking Corporation (RCBC)',
        display_order: 31,
      },
      {
        bank_code: 'RBC',
        bank_name: 'Robinsons Bank Corporation (Robinsons Bank)',
        display_order: 32,
      },
      {
        bank_code: 'SBC',
        bank_name: 'Security Bank Corporation (Security Bank)',
        display_order: 33,
      },
      {
        bank_code: 'SCB',
        bank_name: 'Standard Chartered Bank',
        display_order: 34,
      },
      {
        bank_code: 'STERLING',
        bank_name: 'Sterling Bank',
        display_order: 35,
      },
      {
        bank_code: 'UCPB',
        bank_name: 'United Coconut Planters Bank (UCPB)',
        display_order: 36,
      },
      // Digital Banks / E-Wallets (display_order 50+)
      {
        bank_code: 'GCASH',
        bank_name: 'GCash',
        display_order: 50,
      },
      {
        bank_code: 'MAYA',
        bank_name: 'Maya (PayMaya)',
        display_order: 51,
      },
      {
        bank_code: 'GRAB',
        bank_name: 'GrabPay',
        display_order: 52,
      },
      {
        bank_code: 'CIMB',
        bank_name: 'CIMB Bank Philippines',
        display_order: 53,
      },
      {
        bank_code: 'TONIK',
        bank_name: 'Tonik Digital Bank',
        display_order: 54,
      },
      {
        bank_code: 'KOMO',
        bank_name: 'KOMO (EastWest)',
        display_order: 55,
      },
      {
        bank_code: 'DISKARTECH',
        bank_name: 'DiskarTech (RCBC)',
        display_order: 56,
      },
      {
        bank_code: 'GOTYME',
        bank_name: 'GoTyme Bank',
        display_order: 57,
      },
      {
        bank_code: 'SEABANK',
        bank_name: 'SeaBank Philippines',
        display_order: 58,
      },
      // Catch-all
      {
        bank_code: 'OTHERS',
        bank_name: 'Other Banks',
        display_order: 99,
      },
    ];
    let createdCount = 0;
    for (const input of banks) {
      const existing = await this.repository.findOne({
        where: { bank_code: input.bank_code },
      });
      if (!existing) {
        await ensureBank(input, adminUser);
        createdCount++;
      }
    }
    console.log(
      `✅ Banks seed completed (${banks.length} defined, ${createdCount} inserted)`,
    );
  }
}
