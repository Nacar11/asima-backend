import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds 'Inactive' to the sellers_status_enum so the new validation matches DB allowed values.
 */
export class AddInactiveToSellersStatusEnum1770025001000
  implements MigrationInterface
{
  name = 'AddInactiveToSellersStatusEnum1770025001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."sellers_status_enum" ADD VALUE IF NOT EXISTS 'Inactive'`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No safe down: removing enum values in Postgres requires recreating the type.
  }
}
