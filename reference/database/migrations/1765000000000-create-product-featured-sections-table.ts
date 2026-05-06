import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateProductFeaturedSectionsTable1765000000000
  implements MigrationInterface
{
  name = 'CreateProductFeaturedSectionsTable1765000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the featured_section_enum type if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE featured_section_enum AS ENUM ('featured', 'bestsellers', 'new_arrivals', 'trending');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create the junction table
    await queryRunner.createTable(
      new Table({
        name: 'product_featured_sections',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'product_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'section',
            type: 'featured_section_enum',
            isNullable: false,
          },
          {
            name: 'display_order',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'featured_at',
            type: 'timestamp',
            isNullable: false,
            default: 'NOW()',
          },
          {
            name: 'featured_by',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'NOW()',
          },
        ],
      }),
      true,
    );

    // Add unique constraint on product_id + section (if not exists)
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE product_featured_sections
        ADD CONSTRAINT uq_product_section UNIQUE (product_id, section);
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add foreign key to products (if not exists)
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE product_featured_sections
        ADD CONSTRAINT fk_pfs_product FOREIGN KEY (product_id)
        REFERENCES products(id) ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add foreign key to user for featured_by (if not exists)
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE product_featured_sections
        ADD CONSTRAINT fk_pfs_featured_by FOREIGN KEY (featured_by)
        REFERENCES "user"(id) ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create indexes for performance (if not exists)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pfs_section_order ON product_featured_sections(section, display_order)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pfs_product ON product_featured_sections(product_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pfs_featured_at ON product_featured_sections(featured_at)
    `);

    // Migrate existing data from products table to junction table
    await queryRunner.query(`
      INSERT INTO product_featured_sections (product_id, section, display_order, featured_at, featured_by, created_at)
      SELECT 
        id as product_id,
        featured_section::featured_section_enum as section,
        featured_order as display_order,
        COALESCE(featured_at, NOW()) as featured_at,
        featured_by,
        NOW() as created_at
      FROM products
      WHERE is_featured = true AND deleted_at IS NULL
    `);

    // Drop the old featured columns and constraints from products table
    await queryRunner.query(`
      ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_featured_by
    `);
    await queryRunner.query(`
      ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_featured_section
    `);
    await queryRunner.dropIndex('products', 'idx_products_featured_section');
    await queryRunner.dropIndex('products', 'idx_products_featured');
    await queryRunner.dropColumn('products', 'featured_by');
    await queryRunner.dropColumn('products', 'featured_section');
    await queryRunner.dropColumn('products', 'featured_order');
    await queryRunner.dropColumn('products', 'featured_at');
    await queryRunner.dropColumn('products', 'is_featured');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate the old columns on products table
    await queryRunner.query(`
      ALTER TABLE products ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE products ADD COLUMN featured_at TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE products ADD COLUMN featured_order INTEGER NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE products ADD COLUMN featured_section VARCHAR(50) NOT NULL DEFAULT 'featured'
    `);
    await queryRunner.query(`
      ALTER TABLE products ADD COLUMN featured_by INTEGER
    `);

    // Add constraints back
    await queryRunner.query(`
      ALTER TABLE products
      ADD CONSTRAINT chk_featured_section
      CHECK (featured_section IN ('featured', 'bestsellers', 'new_arrivals', 'trending'))
    `);
    await queryRunner.query(`
      ALTER TABLE products
      ADD CONSTRAINT fk_products_featured_by
      FOREIGN KEY (featured_by) REFERENCES "user"(id)
    `);

    // Create indexes back
    await queryRunner.query(`
      CREATE INDEX idx_products_featured ON products (is_featured, status, featured_order)
      WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX idx_products_featured_section ON products (featured_section, featured_order)
      WHERE is_featured = TRUE AND deleted_at IS NULL
    `);

    // Migrate data back - take the first section entry for each product
    await queryRunner.query(`
      UPDATE products p
      SET 
        is_featured = true,
        featured_at = pfs.featured_at,
        featured_order = pfs.display_order,
        featured_section = pfs.section::VARCHAR,
        featured_by = pfs.featured_by
      FROM (
        SELECT DISTINCT ON (product_id) *
        FROM product_featured_sections
        ORDER BY product_id, created_at ASC
      ) pfs
      WHERE p.id = pfs.product_id
    `);

    // Drop the junction table
    await queryRunner.dropTable('product_featured_sections', true);

    // Drop the enum type
    await queryRunner.query(`DROP TYPE IF EXISTS featured_section_enum`);
  }
}
