import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccountDeletionTables1740550000000
  implements MigrationInterface
{
  name = 'CreateAccountDeletionTables1740550000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create account_deletion_requests table
    await queryRunner.query(`
      CREATE TABLE "account_deletion_requests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying(255) NOT NULL,
        "full_name" character varying(255) NOT NULL,
        "phone_number" character varying(50),
        "account_type" character varying(50) NOT NULL,
        "reason" character varying(255) NOT NULL,
        "additional_comments" text,
        "ip_address" character varying(45) NOT NULL,
        "user_agent" text NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'pending',
        "reference_number" character varying(50) NOT NULL,
        "processed_by_id" uuid,
        "processed_at" TIMESTAMP,
        "processing_notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_account_deletion_requests" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_account_deletion_requests_reference_number" UNIQUE ("reference_number")
      )
    `);

    // Create indexes for account_deletion_requests
    await queryRunner.query(`
      CREATE INDEX "IDX_account_deletion_requests_email" 
      ON "account_deletion_requests" ("email")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_account_deletion_requests_reference_number" 
      ON "account_deletion_requests" ("reference_number")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_account_deletion_requests_status" 
      ON "account_deletion_requests" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_account_deletion_requests_created_at" 
      ON "account_deletion_requests" ("created_at")
    `);

    // Create account_deletion_otps table
    await queryRunner.query(`
      CREATE TABLE "account_deletion_otps" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying(255) NOT NULL,
        "otp" character varying(6) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "verified" boolean NOT NULL DEFAULT false,
        "ip_address" character varying(45) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_account_deletion_otps" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for account_deletion_otps
    await queryRunner.query(`
      CREATE INDEX "IDX_account_deletion_otps_email" 
      ON "account_deletion_otps" ("email")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_account_deletion_otps_expires_at" 
      ON "account_deletion_otps" ("expires_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes for account_deletion_otps
    await queryRunner.query(`
      DROP INDEX "IDX_account_deletion_otps_expires_at"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_account_deletion_otps_email"
    `);

    // Drop account_deletion_otps table
    await queryRunner.query(`
      DROP TABLE "account_deletion_otps"
    `);

    // Drop indexes for account_deletion_requests
    await queryRunner.query(`
      DROP INDEX "IDX_account_deletion_requests_created_at"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_account_deletion_requests_status"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_account_deletion_requests_reference_number"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_account_deletion_requests_email"
    `);

    // Drop account_deletion_requests table
    await queryRunner.query(`
      DROP TABLE "account_deletion_requests"
    `);
  }
}
