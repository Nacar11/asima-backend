import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyLogoRecordEnums1758696006359
  implements MigrationInterface
{
  name = 'AddCompanyLogoRecordEnums1758696006359';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."attachments_record_type_enum" RENAME TO "attachments_record_type_enum_old";
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."attachments_record_type_enum" AS ENUM(
        'Employee Certificate',
        'Cust_Sign',
        'Del_Conf',
        'Storefront Per Customer',
        'SO Facade For Sales Order',
        'Checklist Guide Item Attachment',
        'Proof of Delivery',
        'Proof of Payment',
        'Customer Unavailable',
        'ir',
        'Purchase Order',
        'Company Logo',
        'Purchase Request Attachment',
        'Invoice',
        'Inventory Transfer',
        'Goods Receipt',
        'Warehouse Requisition',
        'bir_2303',
        'Job Order'
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "attachments" 
      ALTER COLUMN "record_type" TYPE "public"."attachments_record_type_enum" 
      USING "record_type"::text::"public"."attachments_record_type_enum";
    `);

    await queryRunner.query(`
      DROP TYPE "public"."attachments_record_type_enum_old";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."attachments_record_type_enum" RENAME TO "attachments_record_type_enum_old";
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."attachments_record_type_enum" AS ENUM(
        'Employee Certificate',
        'Cust_Sign',
        'Del_Conf',
        'Storefront Per Customer',
        'SO Facade For Sales Order',
        'Checklist Guide Item Attachment',
        'Proof of Delivery',
        'Proof of Payment',
        'Customer Unavailable',
        'ir',
        'Purchase Order',
        'Purchase Request Attachment',
        'Invoice',
        'Inventory Transfer',
        'Goods Receipt',
        'Warehouse Requisition',
        'bir_2303',
        'Job Order'
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "attachments" 
      ALTER COLUMN "record_type" TYPE "public"."attachments_record_type_enum" 
      USING "record_type"::text::"public"."attachments_record_type_enum";
    `);

    await queryRunner.query(`
      DROP TYPE "public"."attachments_record_type_enum_old";
    `);
  }
}
