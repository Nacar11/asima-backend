import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterContraints1733821777189 implements MigrationInterface {
  name = 'AlterContraints1733821777189';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_assignments" DROP CONSTRAINT "FK_809cbdc88dfa484628495fe9985"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_assignments" DROP CONSTRAINT "FK_6cc47337be0682a111c592e5697"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_c6b0b96103f5b99e2c8bb8911da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_a1a7cc3d8a08390e14bb3e6ffa5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_0360d8cbe419fe2a6c1602938a2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_d2f5e343630bd8b7e1e7534e82e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_6bfae5ab9f39212d5b6ad0276b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "cost_center" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "created_by" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "updated_by" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_groups" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_groups" ADD "description" character varying(50) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP COLUMN "permissions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD "permissions" text array NOT NULL`,
    );
    // TODO: Create another migration to add this to ERP Base branch
    // await queryRunner.query(
    //   `ALTER TABLE "employee_details" DROP CONSTRAINT "FK_8ba63b7d507131ff7a9be2959a7"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "employee_details" ADD CONSTRAINT "UQ_8ba63b7d507131ff7a9be2959a7" UNIQUE ("user_id")`,
    // );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_0360d8cbe419fe2a6c1602938a2" FOREIGN KEY ("cost_center") REFERENCES "cost_center"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_d2f5e343630bd8b7e1e7534e82e" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_6bfae5ab9f39212d5b6ad0276b1" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_assignments" ADD CONSTRAINT "FK_eda3818f0bf6ac15a5c5f7c4099" FOREIGN KEY ("group_id") REFERENCES "user_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_assignments" ADD CONSTRAINT "FK_d7f08d4f30bf35eb617d8c7a34e" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_c1799bff0c275f58d4abcc0aa66" FOREIGN KEY ("group_id") REFERENCES "user_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_dbecc05af332c0f4a985501f7b6" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    // TODO: Create another migration to add this to ERP Base branch
    // await queryRunner.query(
    //   `ALTER TABLE "employee_details" ADD CONSTRAINT "FK_8ba63b7d507131ff7a9be2959a7" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    // );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO: Create another migration to add this to ERP Base branch
    // await queryRunner.query(
    //   `ALTER TABLE "employee_details" DROP CONSTRAINT "FK_8ba63b7d507131ff7a9be2959a7"`,
    // );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_dbecc05af332c0f4a985501f7b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_c1799bff0c275f58d4abcc0aa66"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_assignments" DROP CONSTRAINT "FK_d7f08d4f30bf35eb617d8c7a34e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_assignments" DROP CONSTRAINT "FK_eda3818f0bf6ac15a5c5f7c4099"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_6bfae5ab9f39212d5b6ad0276b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_d2f5e343630bd8b7e1e7534e82e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_0360d8cbe419fe2a6c1602938a2"`,
    );
    // TODO: Create another migration to add this to ERP Base branch
    // await queryRunner.query(
    //   `ALTER TABLE "employee_details" DROP CONSTRAINT "UQ_8ba63b7d507131ff7a9be2959a7"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "employee_details" ADD CONSTRAINT "FK_8ba63b7d507131ff7a9be2959a7" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    // );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP COLUMN "permissions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD "permissions" json NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_groups" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_groups" ADD "description" character varying(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "updated_by" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "created_by" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "cost_center" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_6bfae5ab9f39212d5b6ad0276b1" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_d2f5e343630bd8b7e1e7534e82e" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_0360d8cbe419fe2a6c1602938a2" FOREIGN KEY ("cost_center") REFERENCES "cost_center"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_a1a7cc3d8a08390e14bb3e6ffa5" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_c6b0b96103f5b99e2c8bb8911da" FOREIGN KEY ("group_id") REFERENCES "user_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_assignments" ADD CONSTRAINT "FK_6cc47337be0682a111c592e5697" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_assignments" ADD CONSTRAINT "FK_809cbdc88dfa484628495fe9985" FOREIGN KEY ("group_id") REFERENCES "user_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
