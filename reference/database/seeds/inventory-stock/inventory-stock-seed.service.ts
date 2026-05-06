import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryStockEntity } from '@/inventory-stocks/persistence/entities/inventory-stock.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Injectable()
export class InventoryStockSeedService {
  constructor(
    @InjectRepository(ProductVariantEntity)
    private productVariantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(InventoryStockEntity)
    private repository: Repository<InventoryStockEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const forcedInStockSkus = new Set([
      'ip15pm-256-blk',
      'ip15pm-256-wht',
      'ip15pm-512-blk',
      'ip15pm-1tb-blk',
    ]);
    const user = await this.userRepository.findOne({
      where: { id: 1 },
    });
    const seller2User = await this.userRepository.findOne({
      where: { id: 2 },
    });
    if (!user) {
      console.error(
        '❌ No user found. Cannot proceed to seed inventory stocks.',
      );
      return;
    }
    if (!seller2User) {
      console.error(
        '❌ No user found. Cannot proceed to seed inventory stocks.',
      );
      return;
    }
    const variants = await this.productVariantRepository.find({
      relations: ['product'],
    });
    if (variants.length === 0) {
      console.error(
        '❌ No product variants found. Cannot proceed to seed inventory stocks.',
      );
      return;
    }
    const actorUserByProductId = new Map<number, UserEntity>();
    for (const variant of variants) {
      const sellerId = variant.product?.seller_id;
      if (sellerId === 2) {
        actorUserByProductId.set(variant.product_id, seller2User);
        continue;
      }
      actorUserByProductId.set(variant.product_id, user);
    }
    const existingStocks = await this.repository.find();
    const existingByVariantId = new Map<number, InventoryStockEntity>();
    for (const stock of existingStocks) {
      existingByVariantId.set(stock.variant_id, stock);
    }
    const buildInventoryStockForVariant = (
      variant: ProductVariantEntity,
    ): Partial<InventoryStockEntity> => {
      const sku = (variant.sku ?? '').toLowerCase();
      const actorUser = actorUserByProductId.get(variant.product_id) ?? user;
      if (forcedInStockSkus.has(sku)) {
        const stockOnHand = 5;
        const availableQuantity = 95;
        const stockQuantity = stockOnHand + availableQuantity;
        return {
          variant_id: variant.id,
          stock_on_hand: stockOnHand,
          available_quantity: availableQuantity,
          stock_quantity: stockQuantity,
          reserved_quantity: 0,
          min_stock_level: 5,
          last_counted_at: new Date(),
          created_by: actorUser,
          updated_by: actorUser,
        };
      }
      let totalStock = 0;
      let minStockLevel = 0;
      if (sku.includes('iphone') || sku.includes('ipad')) {
        totalStock = Math.floor(Math.random() * 50) + 10;
        minStockLevel = 5;
      } else if (sku.includes('macbook') || sku.includes('sony')) {
        totalStock = Math.floor(Math.random() * 20) + 5;
        minStockLevel = 3;
      } else if (sku.includes('nike') || sku.includes('adidas')) {
        totalStock = Math.floor(Math.random() * 100) + 20;
        minStockLevel = 10;
      } else if (sku.includes('samsung') || sku.includes('sofa')) {
        totalStock = Math.floor(Math.random() * 10) + 2;
        minStockLevel = 1;
      } else if (sku.includes('coffee') || sku.includes('tea')) {
        totalStock = Math.floor(Math.random() * 200) + 50;
        minStockLevel = 25;
      } else if (sku.includes('yoga') || sku.includes('tent')) {
        totalStock = Math.floor(Math.random() * 40) + 8;
        minStockLevel = 5;
      } else {
        totalStock = Math.floor(Math.random() * 30) + 5;
        minStockLevel = 3;
      }
      let stockOnHand = 0;
      if (Math.random() < 0.3) {
        stockOnHand = Math.floor(totalStock * (Math.random() * 0.1));
      }
      // Ensure available quantity is always at least minStockLevel to prevent checkout failures
      let availableQuantity = totalStock - stockOnHand;
      if (availableQuantity < minStockLevel) {
        availableQuantity = minStockLevel;
      }
      let reservedQuantity = 0;
      if (availableQuantity > minStockLevel && Math.random() < 0.2) {
        reservedQuantity = Math.floor(
          Math.random() * Math.min(5, availableQuantity - minStockLevel),
        );
      }
      const stockQuantity = stockOnHand + availableQuantity;
      return {
        variant_id: variant.id,
        stock_on_hand: stockOnHand,
        available_quantity: availableQuantity,
        stock_quantity: stockQuantity,
        reserved_quantity: reservedQuantity,
        min_stock_level: minStockLevel,
        last_counted_at: new Date(
          Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000,
        ),
        created_by: actorUser,
        updated_by: actorUser,
      };
    };
    const newStocks: Partial<InventoryStockEntity>[] = [];
    for (const variant of variants) {
      const sku = (variant.sku ?? '').toLowerCase();
      if (forcedInStockSkus.has(sku)) {
        continue;
      }
      if (existingByVariantId.has(variant.id)) {
        continue;
      }
      newStocks.push(buildInventoryStockForVariant(variant));
    }
    for (const stock of newStocks) {
      const saved = await this.repository.save(stock);
      existingByVariantId.set(saved.variant_id, saved);
    }
    let forcedUpdatedCount = 0;
    const forcedWrittenStocks: Partial<InventoryStockEntity>[] = [];
    for (const variant of variants) {
      const sku = (variant.sku ?? '').toLowerCase();
      if (!forcedInStockSkus.has(sku)) {
        continue;
      }
      const existing =
        existingByVariantId.get(variant.id) ??
        (await this.repository.findOne({
          where: { variant_id: variant.id },
        }));
      const actorUser = actorUserByProductId.get(variant.product_id) ?? user;
      const stockOnHand = 5;
      const availableQuantity = 95;
      const stockQuantity = stockOnHand + availableQuantity;
      const next: Partial<InventoryStockEntity> = {
        ...(existing ? { id: existing.id } : {}),
        variant_id: variant.id,
        stock_on_hand: stockOnHand,
        available_quantity: availableQuantity,
        stock_quantity: stockQuantity,
        reserved_quantity: 0,
        min_stock_level: 5,
        last_counted_at: new Date(),
        created_by: existing?.created_by ?? actorUser,
        updated_by: actorUser,
      };
      const saved = await this.repository.save(next);
      existingByVariantId.set(saved.variant_id, saved);
      forcedWrittenStocks.push(next);
      forcedUpdatedCount++;
    }
    const insertedCount = newStocks.length;
    if (!insertedCount && !forcedUpdatedCount) {
      console.log('⚠️  Inventory stocks already exist, skipping');
      return;
    }
    console.log(
      `✅ Inventory stocks seed completed (${insertedCount} inserted, ${forcedUpdatedCount} forced updated)`,
    );
    const allWritten = [...newStocks, ...forcedWrittenStocks];
    const totalStock = allWritten.reduce(
      (sum, stock) => sum + (stock.stock_quantity ?? 0),
      0,
    );
    const totalAvailable = allWritten.reduce(
      (sum, stock) => sum + (stock.available_quantity ?? 0),
      0,
    );
    const totalReserved = allWritten.reduce(
      (sum, stock) => sum + (stock.reserved_quantity ?? 0),
      0,
    );
    console.log('📊 Inventory Summary:');
    console.log(`   Total Stock: ${totalStock} units`);
    console.log(`   Available: ${totalAvailable} units`);
    console.log(`   Reserved: ${totalReserved} units`);
  }
}
