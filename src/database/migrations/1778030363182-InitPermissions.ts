import { MigrationInterface, QueryRunner } from "typeorm";

export class InitPermissions1778030363182 implements MigrationInterface {
    name = 'InitPermissions1778030363182'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "permissions" ("id" SERIAL NOT NULL, "code" character varying(100) NOT NULL, "resource" character varying(50) NOT NULL, "action" character varying(30) NOT NULL, "description" character varying(255), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_8dad765629e83229da6feda1c1d" UNIQUE ("code"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_89456a09b598ce8915c702c528" ON "permissions" ("resource") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8dad765629e83229da6feda1c1" ON "permissions" ("code") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_8dad765629e83229da6feda1c1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_89456a09b598ce8915c702c528"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
    }

}
