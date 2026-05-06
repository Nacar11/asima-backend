import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add appointment location type support:
 * - service_location_type enum + column on services
 * - appointment_location_type enum + column on bookings
 * - appointment_location_type varchar column on shopping_cart_items and sales_order_items
 * - service_location_address_id FK on sellers
 * - Data migration: is_remote_available = true → service_location_type = 'remote'
 */
export class AddAppointmentLocationType1770500000000
  implements MigrationInterface
{
  name = 'AddAppointmentLocationType1770500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create service_location_type enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "service_location_type_enum" AS ENUM('home_service', 'walk_in', 'both', 'remote');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create appointment_location_type enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "appointment_location_type_enum" AS ENUM('home_service', 'walk_in', 'remote');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    // 3. Add service_location_type column to services (default: home_service)
    await queryRunner.query(`
      ALTER TABLE "services"
      ADD COLUMN "service_location_type" "service_location_type_enum" NOT NULL DEFAULT 'home_service'
    `);

    // 4. Add appointment_location_type column to bookings (default: home_service)
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD COLUMN "appointment_location_type" "appointment_location_type_enum" NOT NULL DEFAULT 'home_service'
    `);

    // 5. Add service_location_address_id FK to sellers
    await queryRunner.query(`
      ALTER TABLE "sellers"
      ADD COLUMN "service_location_address_id" integer NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "sellers"
      ADD CONSTRAINT "FK_sellers_service_location_address"
      FOREIGN KEY ("service_location_address_id") REFERENCES "user_addresses"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // 6. Add appointment_location_type to shopping_cart_items (varchar, nullable)
    await queryRunner.query(`
      ALTER TABLE "shopping_cart_items"
      ADD COLUMN "appointment_location_type" varchar(20) NULL
    `);

    // 7. Add appointment_location_type to sales_order_items (varchar, nullable)
    await queryRunner.query(`
      ALTER TABLE "sales_order_items"
      ADD COLUMN "appointment_location_type" varchar(20) NULL
    `);

    // 8. Data migration: sync service_location_type from is_remote_available
    await queryRunner.query(`
      UPDATE "services" SET "service_location_type" = 'remote' WHERE "is_remote_available" = true
    `);
    await queryRunner.query(`
      UPDATE "services" SET "service_location_type" = 'home_service' WHERE "is_remote_available" = false
    `);

    // 9. Add index on services.service_location_type
    await queryRunner.query(`
      CREATE INDEX "IDX_services_service_location_type" ON "services" ("service_location_type")
    `);

    // 10. Add index on bookings.appointment_location_type
    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_appointment_location_type" ON "bookings" ("appointment_location_type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_bookings_appointment_location_type"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_services_service_location_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_items" DROP COLUMN IF EXISTS "appointment_location_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shopping_cart_items" DROP COLUMN IF EXISTS "appointment_location_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sellers" DROP CONSTRAINT IF EXISTS "FK_sellers_service_location_address"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sellers" DROP COLUMN IF EXISTS "service_location_address_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN IF EXISTS "appointment_location_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "service_location_type"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "appointment_location_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "service_location_type_enum"`);
  }
}
