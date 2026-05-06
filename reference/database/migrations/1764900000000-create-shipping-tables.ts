import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
  TableColumn,
  TableUnique,
} from 'typeorm';

/**
 * Migration to create shipping tables for Phase 1 (Local Delivery)
 * Extension-ready schema that requires NO changes for Phase 2/3
 *
 * Creates:
 * - shipping_providers: Registry of carriers/strategies
 * - shipping_zones: Geographic regions per provider
 * - shipping_zone_areas: Which locations belong to zones
 * - shipping_methods: Rate configuration per provider
 * - shipping_method_zone_rates: Zone-specific rate overrides
 * - shipping_distance_tiers: Tiered distance pricing
 * - shipping_surge_rules: Time-based surge pricing (Phase 2, table created now)
 *
 * Alters:
 * - product_variants: Add weight_kg, length_cm, width_cm, height_cm
 * - sellers: Add pickup location fields
 * - user_addresses: Add latitude, longitude
 */
export class CreateShippingTables1764900000000 implements MigrationInterface {
  name = 'CreateShippingTables1764900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create shipping_providers table
    await queryRunner.createTable(
      new Table({
        name: 'shipping_providers',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'provider_type',
            type: 'enum',
            enum: ['in_house', 'third_party', 'api_carrier'],
            default: "'in_house'",
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'display_order',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_by',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'shipping_providers',
      new TableIndex({
        name: 'idx_shipping_providers_code',
        columnNames: ['code'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'shipping_providers',
      new TableIndex({
        name: 'idx_shipping_providers_is_active',
        columnNames: ['is_active'],
      }),
    );

    await queryRunner.createForeignKey(
      'shipping_providers',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'shipping_providers',
      new TableForeignKey({
        columnNames: ['updated_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );

    // 2. Create shipping_zones table
    await queryRunner.createTable(
      new Table({
        name: 'shipping_zones',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'provider_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'priority',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_by',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'shipping_zones',
      new TableIndex({
        name: 'idx_shipping_zones_provider_id',
        columnNames: ['provider_id'],
      }),
    );

    await queryRunner.createIndex(
      'shipping_zones',
      new TableIndex({
        name: 'idx_shipping_zones_priority',
        columnNames: ['priority'],
      }),
    );

    await queryRunner.createForeignKey(
      'shipping_zones',
      new TableForeignKey({
        columnNames: ['provider_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'shipping_providers',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'shipping_zones',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'shipping_zones',
      new TableForeignKey({
        columnNames: ['updated_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );

    // 3. Create shipping_zone_areas table
    await queryRunner.createTable(
      new Table({
        name: 'shipping_zone_areas',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'zone_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'area_type',
            type: 'enum',
            enum: ['country', 'region', 'province', 'city', 'postal_code'],
            isNullable: false,
          },
          {
            name: 'area_value',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'shipping_zone_areas',
      new TableIndex({
        name: 'idx_zone_areas_lookup',
        columnNames: ['area_type', 'area_value'],
      }),
    );

    await queryRunner.createIndex(
      'shipping_zone_areas',
      new TableIndex({
        name: 'idx_zone_areas_zone_id',
        columnNames: ['zone_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'shipping_zone_areas',
      new TableForeignKey({
        columnNames: ['zone_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'shipping_zones',
        onDelete: 'CASCADE',
      }),
    );

    // 4. Create shipping_methods table
    await queryRunner.createTable(
      new Table({
        name: 'shipping_methods',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'provider_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'base_fee',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'rate_per_km',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'rate_per_kg',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'max_distance_km',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'minimum_fee',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'free_shipping_threshold',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'free_shipping_max_weight_kg',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment:
              'Maximum weight (kg) to qualify for free shipping. Orders exceeding this weight pay shipping even if subtotal meets threshold.',
          },
          {
            name: 'volumetric_divisor',
            type: 'integer',
            default: 5000,
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'display_order',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_by',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'shipping_methods',
      new TableIndex({
        name: 'idx_shipping_methods_provider_id',
        columnNames: ['provider_id'],
      }),
    );

    await queryRunner.createIndex(
      'shipping_methods',
      new TableIndex({
        name: 'idx_shipping_methods_is_active',
        columnNames: ['is_active'],
      }),
    );

    await queryRunner.createForeignKey(
      'shipping_methods',
      new TableForeignKey({
        columnNames: ['provider_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'shipping_providers',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'shipping_methods',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'shipping_methods',
      new TableForeignKey({
        columnNames: ['updated_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );

    // 5. Create shipping_method_zone_rates table (zone-specific overrides)
    await queryRunner.createTable(
      new Table({
        name: 'shipping_method_zone_rates',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'method_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'zone_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'base_fee',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'rate_per_km',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'rate_per_kg',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'max_distance_km',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'minimum_fee',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'free_shipping_threshold',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createUniqueConstraint(
      'shipping_method_zone_rates',
      new TableUnique({
        name: 'uq_method_zone',
        columnNames: ['method_id', 'zone_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'shipping_method_zone_rates',
      new TableForeignKey({
        columnNames: ['method_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'shipping_methods',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'shipping_method_zone_rates',
      new TableForeignKey({
        columnNames: ['zone_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'shipping_zones',
        onDelete: 'CASCADE',
      }),
    );

    // 6. Create shipping_distance_tiers table
    await queryRunner.createTable(
      new Table({
        name: 'shipping_distance_tiers',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'method_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'zone_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'min_distance_km',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'max_distance_km',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'fee',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'display_order',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'shipping_distance_tiers',
      new TableIndex({
        name: 'idx_shipping_distance_tiers_method_id',
        columnNames: ['method_id'],
      }),
    );

    await queryRunner.createIndex(
      'shipping_distance_tiers',
      new TableIndex({
        name: 'idx_shipping_distance_tiers_zone_id',
        columnNames: ['zone_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'shipping_distance_tiers',
      new TableForeignKey({
        columnNames: ['method_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'shipping_methods',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'shipping_distance_tiers',
      new TableForeignKey({
        columnNames: ['zone_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'shipping_zones',
        onDelete: 'CASCADE',
      }),
    );

    // 7. Create shipping_surge_rules table (Phase 2, table created now)
    await queryRunner.createTable(
      new Table({
        name: 'shipping_surge_rules',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'method_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'zone_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'day_of_week',
            type: 'integer',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'start_time',
            type: 'time',
            isNullable: false,
          },
          {
            name: 'end_time',
            type: 'time',
            isNullable: false,
          },
          {
            name: 'surge_multiplier',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'shipping_surge_rules',
      new TableIndex({
        name: 'idx_shipping_surge_rules_method_id',
        columnNames: ['method_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'shipping_surge_rules',
      new TableForeignKey({
        columnNames: ['method_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'shipping_methods',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'shipping_surge_rules',
      new TableForeignKey({
        columnNames: ['zone_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'shipping_zones',
        onDelete: 'CASCADE',
      }),
    );

    // 8. Add weight/dimensions columns to product_variants (nullable, required for Active)
    await queryRunner.addColumns('product_variants', [
      new TableColumn({
        name: 'weight_kg',
        type: 'decimal',
        precision: 10,
        scale: 3,
        isNullable: true,
      }),
      new TableColumn({
        name: 'length_cm',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      }),
      new TableColumn({
        name: 'width_cm',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      }),
      new TableColumn({
        name: 'height_cm',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      }),
    ]);

    // 9. Add pickup location columns to sellers
    await queryRunner.addColumns('sellers', [
      new TableColumn({
        name: 'pickup_address',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'pickup_city',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'pickup_province',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'pickup_postal_code',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
      new TableColumn({
        name: 'pickup_latitude',
        type: 'decimal',
        precision: 10,
        scale: 8,
        isNullable: true,
      }),
      new TableColumn({
        name: 'pickup_longitude',
        type: 'decimal',
        precision: 11,
        scale: 8,
        isNullable: true,
      }),
    ]);

    // 10. Add coordinates columns to user_addresses
    await queryRunner.addColumns('user_addresses', [
      new TableColumn({
        name: 'latitude',
        type: 'decimal',
        precision: 10,
        scale: 8,
        isNullable: true,
      }),
      new TableColumn({
        name: 'longitude',
        type: 'decimal',
        precision: 11,
        scale: 8,
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns from user_addresses
    await queryRunner.dropColumn('user_addresses', 'longitude');
    await queryRunner.dropColumn('user_addresses', 'latitude');

    // Remove columns from sellers
    await queryRunner.dropColumn('sellers', 'pickup_longitude');
    await queryRunner.dropColumn('sellers', 'pickup_latitude');
    await queryRunner.dropColumn('sellers', 'pickup_postal_code');
    await queryRunner.dropColumn('sellers', 'pickup_province');
    await queryRunner.dropColumn('sellers', 'pickup_city');
    await queryRunner.dropColumn('sellers', 'pickup_address');

    // Remove columns from product_variants
    await queryRunner.dropColumn('product_variants', 'height_cm');
    await queryRunner.dropColumn('product_variants', 'width_cm');
    await queryRunner.dropColumn('product_variants', 'length_cm');
    await queryRunner.dropColumn('product_variants', 'weight_kg');

    // Drop tables in reverse order
    await queryRunner.dropTable('shipping_surge_rules');
    await queryRunner.dropTable('shipping_distance_tiers');
    await queryRunner.dropTable('shipping_method_zone_rates');
    await queryRunner.dropTable('shipping_methods');
    await queryRunner.dropTable('shipping_zone_areas');
    await queryRunner.dropTable('shipping_zones');
    await queryRunner.dropTable('shipping_providers');
  }
}
