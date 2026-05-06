import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLifecycleFieldsToIndependentPickleballMerchants1776400000000
  implements MigrationInterface
{
  name = 'AddLifecycleFieldsToIndependentPickleballMerchants1776400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "pickleball_merchant_applications"
      ADD COLUMN IF NOT EXISTS "owner_setup_status" character varying(40) NOT NULL DEFAULT 'not_started',
      ADD COLUMN IF NOT EXISTS "owner_setup_completed_at" TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS "subscription_payment_status" character varying(40) NOT NULL DEFAULT 'not_started',
      ADD COLUMN IF NOT EXISTS "subscription_payment_submitted_at" TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS "subscription_payment_reviewed_at" TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS "subscription_payment_reviewed_by" integer NULL,
      ADD COLUMN IF NOT EXISTS "subscription_payment_rejection_reason" text NULL,
      ADD COLUMN IF NOT EXISTS "onboarding_status" character varying(40) NOT NULL DEFAULT 'not_started',
      ADD COLUMN IF NOT EXISTS "onboarding_started_at" TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS "onboarding_completed_at" TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS "onboarding_completed_by" integer NULL,
      ADD COLUMN IF NOT EXISTS "listing_status" character varying(20) NOT NULL DEFAULT 'hidden',
      ADD COLUMN IF NOT EXISTS "listing_published_at" TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMPTZ NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "subscription_payments"
      ADD COLUMN IF NOT EXISTS "payment_reference_number" character varying(255) NULL,
      ADD COLUMN IF NOT EXISTS "payment_proof_url" character varying(1000) NULL,
      ADD COLUMN IF NOT EXISTS "payment_proof_key" character varying(500) NULL,
      ADD COLUMN IF NOT EXISTS "submitted_at" TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS "reviewed_by" integer NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscription_payments"
      DROP COLUMN IF EXISTS "reviewed_by",
      DROP COLUMN IF EXISTS "reviewed_at",
      DROP COLUMN IF EXISTS "submitted_at",
      DROP COLUMN IF EXISTS "payment_proof_key",
      DROP COLUMN IF EXISTS "payment_proof_url",
      DROP COLUMN IF EXISTS "payment_reference_number"
    `);

    await queryRunner.query(`
      ALTER TABLE "pickleball_merchant_applications"
      DROP COLUMN IF EXISTS "completed_at",
      DROP COLUMN IF EXISTS "listing_published_at",
      DROP COLUMN IF EXISTS "listing_status",
      DROP COLUMN IF EXISTS "onboarding_completed_by",
      DROP COLUMN IF EXISTS "onboarding_completed_at",
      DROP COLUMN IF EXISTS "onboarding_started_at",
      DROP COLUMN IF EXISTS "onboarding_status",
      DROP COLUMN IF EXISTS "subscription_payment_rejection_reason",
      DROP COLUMN IF EXISTS "subscription_payment_reviewed_by",
      DROP COLUMN IF EXISTS "subscription_payment_reviewed_at",
      DROP COLUMN IF EXISTS "subscription_payment_submitted_at",
      DROP COLUMN IF EXISTS "subscription_payment_status",
      DROP COLUMN IF EXISTS "owner_setup_completed_at",
      DROP COLUMN IF EXISTS "owner_setup_status"
    `);
  }
}
