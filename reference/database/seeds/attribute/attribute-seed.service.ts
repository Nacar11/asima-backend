import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributeEntity } from '@/attributes/persistence/entities/attribute.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Injectable()
export class AttributeSeedService {
  constructor(
    @InjectRepository(AttributeEntity)
    private attributeRepository: Repository<AttributeEntity>,
    @InjectRepository(SellerEntity)
    private sellerRepository: Repository<SellerEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: 1 },
    });
    const seller2User = await this.userRepository.findOne({
      where: { id: 2 },
    });
    if (!user) {
      console.error('❌ No user found. Cannot proceed to seed attributes.');
      return;
    }
    if (!seller2User) {
      console.error('❌ No user found. Cannot proceed to seed attributes.');
      return;
    }
    const seller1 = await this.sellerRepository.findOne({
      where: { id: 1 },
    });
    const seller2 = await this.sellerRepository.findOne({
      where: { id: 2 },
    });
    if (!seller1 || !seller2) {
      console.error(
        '❌ Sellers not found. Cannot proceed to seed attributes. Please run seller seeder first.',
      );
      return;
    }
    const ensureAttribute = async (input: {
      readonly seller_id: number;
      readonly name: string;
    }): Promise<AttributeEntity> => {
      const actorUser = input.seller_id === seller2.id ? seller2User : user;
      const existing = await this.attributeRepository.findOne({
        where: {
          seller_id: input.seller_id,
          name: input.name,
        },
      });
      if (existing) {
        await this.attributeRepository.save({
          ...existing,
          created_by: actorUser,
          updated_by: actorUser,
        });
        return existing;
      }
      return this.attributeRepository.save(
        this.attributeRepository.create({
          seller_id: input.seller_id,
          name: input.name,
          status: 'Active',
          created_by: actorUser,
          updated_by: actorUser,
        }),
      );
    };
    const seller1AttributeNames = [
      'Color',
      'Storage',
      'RAM',
      'Processor',
      'Screen Size',
      'Connectivity',
      'Size',
      'Style',
      'Roast Level',
      'Grind Type',
      'Origin',
      'Tea Type',
      'Steep Time',
      'Cocoa Percentage',
      'Material',
      'Blade Count',
      'Capacity',
      'Waterproof Rating',
      'Thickness',
      'Length',
      'Genre',
      'Book Count',
      'String Type',
      'Wood Type',
      'Metal Type',
      'Gemstone',
      'Organic Certified',
      'Freshness',
      'Customization Type',
      'Canvas Size',
      'Grade',
      'Flavor Profile',
      'Tea Grade',
      'Processing Method',
      'Volume',
      'Weight',
      'Power',
      'Quantity',
    ];
    const seller2AttributeNames = [
      'Size',
      'Color',
      'Material',
      'Style',
      'Fit',
      'Capacity',
      'Thickness',
      'Length',
      'Waterproof Rating',
      'Skin Type',
      'Fragrance',
      'Quantity',
    ];
    // Uncle Brew (Seller 3) attributes
    const seller3 = await this.sellerRepository.findOne({
      where: { id: 3 },
    });
    const seller3User = await this.userRepository.findOne({
      where: { id: 3 },
    });
    const seller3AttributeNames = [
      'Drink Size',
      'Sugar Level',
      'Ice Level',
      'Flavor',
      'Add-on',
      'Temperature',
      'Cup Type',
      'Quantity',
      'Equipment Type',
      'Capacity',
      'Power Rating',
      'Material',
    ];
    let createdCount = 0;
    for (const name of seller1AttributeNames) {
      const existing = await this.attributeRepository.findOne({
        where: { seller_id: seller1.id, name },
      });
      if (!existing) {
        await ensureAttribute({ seller_id: seller1.id, name });
        createdCount++;
      }
    }
    for (const name of seller2AttributeNames) {
      const existing = await this.attributeRepository.findOne({
        where: { seller_id: seller2.id, name },
      });
      if (!existing) {
        await ensureAttribute({ seller_id: seller2.id, name });
        createdCount++;
      }
    }
    if (seller3 && seller3User) {
      for (const name of seller3AttributeNames) {
        const existing = await this.attributeRepository.findOne({
          where: { seller_id: seller3.id, name },
        });
        if (!existing) {
          await this.attributeRepository.save(
            this.attributeRepository.create({
              seller_id: seller3.id,
              name,
              status: 'Active',
              created_by: seller3User,
              updated_by: seller3User,
            }),
          );
          createdCount++;
        }
      }
    }
    console.log(`✅ Attributes seed completed (${createdCount} inserted)`);
  }
}
