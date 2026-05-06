import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCheckoutSessions1771581759984 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "checkout_sessions" (
                "id" SERIAL PRIMARY KEY,
                "user_id" INTEGER NOT NULL,
                "session_token" VARCHAR(255) NOT NULL UNIQUE,
                "payment_method_code" VARCHAR(50) NOT NULL,
                "items" JSONB NOT NULL,
                "shipping_address_id" INTEGER,
                "billing_address_id" INTEGER,
                "total_amount" DECIMAL(10,2) NOT NULL,
                "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
                "expires_at" TIMESTAMP NOT NULL,
                "created_at" TIMESTAMP DEFAULT NOW(),
                "updated_at" TIMESTAMP DEFAULT NOW(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "FK_checkout_sessions_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_checkout_sessions_shipping_address" FOREIGN KEY ("shipping_address_id") REFERENCES "user_addresses"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_checkout_sessions_billing_address" FOREIGN KEY ("billing_address_id") REFERENCES "user_addresses"("id") ON DELETE SET NULL
            );

            CREATE INDEX "IDX_checkout_sessions_user" ON "checkout_sessions"("user_id");
            CREATE INDEX "IDX_checkout_sessions_token" ON "checkout_sessions"("session_token");
            CREATE INDEX "IDX_checkout_sessions_status" ON "checkout_sessions"("status");
            CREATE INDEX "IDX_checkout_sessions_expires" ON "checkout_sessions"("expires_at");
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "checkout_sessions"`);
  }
}
