import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueConstraints1731850671818 implements MigrationInterface {
  name = 'AddUniqueConstraints1731850671818';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "division" ADD CONSTRAINT "UQ_ca5fe043d9125c8fa123fe5ac93" UNIQUE ("division_code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" ADD CONSTRAINT "UQ_bf89872baab804a587eb19829e7" UNIQUE ("department_code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "section" ADD CONSTRAINT "UQ_75ef91fe66654b4e5d1862d3dde" UNIQUE ("section_code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_section" ADD CONSTRAINT "UQ_d57e461af3254a4d7deecc57ae2" UNIQUE ("sub_section_code")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sub_section" DROP CONSTRAINT "UQ_d57e461af3254a4d7deecc57ae2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "section" DROP CONSTRAINT "UQ_75ef91fe66654b4e5d1862d3dde"`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" DROP CONSTRAINT "UQ_bf89872baab804a587eb19829e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "division" DROP CONSTRAINT "UQ_ca5fe043d9125c8fa123fe5ac93"`,
    );
  }
}
