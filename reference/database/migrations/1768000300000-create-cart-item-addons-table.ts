import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCartItemAddonsTable1768000300000
  implements MigrationInterface
{
  name = 'CreateCartItemAddonsTable1768000300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "cart_item_addons" (
        "id" SERIAL NOT NULL,
        "cart_item_id" integer NOT NULL,
        "addon_id" integer NOT NULL,
        "quantity" integer NOT NULL DEFAULT 1,
        "unit_price" numeric(12,2) NOT NULL,
        "total_price" numeric(12,2) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cart_item_addons_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cart_item_addons_cart_item" FOREIGN KEY ("cart_item_id") REFERENCES "shopping_cart_items"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cart_item_addons_addon" FOREIGN KEY ("addon_id") REFERENCES "service_addons"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_cart_item_addons_cart_item_id" ON "cart_item_addons" ("cart_item_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cart_item_addons_addon_id" ON "cart_item_addons" ("addon_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_cart_item_addons_cart_addon" ON "cart_item_addons" ("cart_item_id", "addon_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_cart_item_addons_cart_addon"`);
    await queryRunner.query(`DROP INDEX "IDX_cart_item_addons_addon_id"`);
    await queryRunner.query(`DROP INDEX "IDX_cart_item_addons_cart_item_id"`);
    await queryRunner.query(`DROP TABLE "cart_item_addons"`);
  }
}
