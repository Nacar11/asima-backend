import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserDeviceTokensTable1766395064418
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_device_tokens" (
        "id" SERIAL PRIMARY KEY,
        "user_id" integer NOT NULL,
        "device_token" varchar(500) NOT NULL,
        "device_type" varchar(20) NOT NULL DEFAULT 'mobile',
        "device_name" varchar(100),
        "is_active" boolean NOT NULL DEFAULT true,
        "last_used_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_user_device_tokens_user_id" FOREIGN KEY ("user_id") 
          REFERENCES "user"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_device_tokens_user_id" ON "user_device_tokens" ("user_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_user_device_tokens_token" ON "user_device_tokens" ("device_token")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_device_tokens_token"`);
    await queryRunner.query(`DROP INDEX "IDX_user_device_tokens_user_id"`);
    await queryRunner.query(`DROP TABLE "user_device_tokens"`);
  }
}
