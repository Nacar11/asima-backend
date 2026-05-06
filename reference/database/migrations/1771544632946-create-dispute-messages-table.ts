import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDisputeMessagesTable1771544632946
  implements MigrationInterface
{
  name = 'CreateDisputeMessagesTable1771544632946';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "dispute_messages" (
        "id" SERIAL NOT NULL,
        "dispute_id" integer NOT NULL,
        "sender_id" integer NOT NULL,
        "sender_role" character varying(20) NOT NULL,
        "message" text NOT NULL,
        "attachment_urls" text array,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dispute_messages" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_dispute_messages_dispute_id"
      ON "dispute_messages" ("dispute_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_dispute_messages_sender_id"
      ON "dispute_messages" ("sender_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "dispute_messages"
      ADD CONSTRAINT "FK_dispute_messages_dispute_id"
      FOREIGN KEY ("dispute_id")
      REFERENCES "disputes"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "dispute_messages"
      ADD CONSTRAINT "FK_dispute_messages_sender_id"
      FOREIGN KEY ("sender_id")
      REFERENCES "user"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dispute_messages" DROP CONSTRAINT "FK_dispute_messages_sender_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispute_messages" DROP CONSTRAINT "FK_dispute_messages_dispute_id"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_dispute_messages_sender_id"`);
    await queryRunner.query(`DROP INDEX "IDX_dispute_messages_dispute_id"`);
    await queryRunner.query(`DROP TABLE "dispute_messages"`);
  }
}
