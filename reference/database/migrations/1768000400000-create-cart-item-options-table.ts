import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCartItemOptionsTable1768000400000
  implements MigrationInterface
{
  name = 'CreateCartItemOptionsTable1768000400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "cart_item_options" (
        "id" SERIAL NOT NULL,
        "cart_item_id" integer NOT NULL,
        "option_group_id" integer NOT NULL,
        "option_value_id" integer NOT NULL,
        "quantity" integer NOT NULL DEFAULT 1,
        "price_adjustment" numeric(12,2) NOT NULL DEFAULT 0,
        "duration_adjustment_minutes" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cart_item_options_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cart_item_options_cart_item" FOREIGN KEY ("cart_item_id") REFERENCES "shopping_cart_items"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cart_item_options_option_group" FOREIGN KEY ("option_group_id") REFERENCES "service_option_groups"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cart_item_options_option_value" FOREIGN KEY ("option_value_id") REFERENCES "service_option_values"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_cart_item_options_cart_item_id" ON "cart_item_options" ("cart_item_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_cart_item_options_cart_group" ON "cart_item_options" ("cart_item_id", "option_group_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_cart_item_options_cart_group"`);
    await queryRunner.query(`DROP INDEX "IDX_cart_item_options_cart_item_id"`);
    await queryRunner.query(`DROP TABLE "cart_item_options"`);
  }
}
