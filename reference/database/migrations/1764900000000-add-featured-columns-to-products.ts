import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddFeaturedColumnsToProducts1764900000000
  implements MigrationInterface
{
  name = 'AddFeaturedColumnsToProducts1764900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_featured column
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'is_featured',
        type: 'boolean',
        default: false,
        isNullable: false,
        comment: 'Whether the product is featured',
      }),
    );

    // Add featured_at column
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'featured_at',
        type: 'timestamp',
        isNullable: true,
        comment: 'Timestamp when the product was featured',
      }),
    );

    // Add featured_order column
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'featured_order',
        type: 'integer',
        default: 0,
        isNullable: false,
        comment: 'Display order for featured products',
      }),
    );

    // Add featured_section column with check constraint
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'featured_section',
        type: 'varchar',
        length: '50',
        default: "'featured'",
        isNullable: false,
        comment:
          'Section where product is featured (featured, bestsellers, new_arrivals, trending)',
      }),
    );

    // Add check constraint for featured_section values
    await queryRunner.query(`
      ALTER TABLE products
      ADD CONSTRAINT chk_featured_section
      CHECK (featured_section IN ('featured', 'bestsellers', 'new_arrivals', 'trending'))
    `);

    // Add featured_by column (admin who featured the product)
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'featured_by',
        type: 'integer',
        isNullable: true,
        comment: 'User ID of admin who featured the product',
      }),
    );

    // Add foreign key for featured_by
    await queryRunner.query(`
      ALTER TABLE products
      ADD CONSTRAINT fk_products_featured_by
      FOREIGN KEY (featured_by) REFERENCES "user"(id)
    `);

    // Create index for featured products query optimization
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'idx_products_featured',
        columnNames: ['is_featured', 'status', 'featured_order'],
        where: 'deleted_at IS NULL',
      }),
    );

    // Create index for featured section queries
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'idx_products_featured_section',
        columnNames: ['featured_section', 'featured_order'],
        where: 'is_featured = TRUE AND deleted_at IS NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('products', 'idx_products_featured_section');
    await queryRunner.dropIndex('products', 'idx_products_featured');

    // Drop foreign key
    await queryRunner.query(`
      ALTER TABLE products
      DROP CONSTRAINT IF EXISTS fk_products_featured_by
    `);

    // Drop check constraint
    await queryRunner.query(`
      ALTER TABLE products
      DROP CONSTRAINT IF EXISTS chk_featured_section
    `);

    // Drop columns
    await queryRunner.dropColumn('products', 'featured_by');
    await queryRunner.dropColumn('products', 'featured_section');
    await queryRunner.dropColumn('products', 'featured_order');
    await queryRunner.dropColumn('products', 'featured_at');
    await queryRunner.dropColumn('products', 'is_featured');
  }
}
