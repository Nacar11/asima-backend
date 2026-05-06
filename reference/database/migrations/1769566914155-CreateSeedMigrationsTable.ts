import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSeedMigrationsTable1769566914155
  implements MigrationInterface
{
  name = 'CreateSeedMigrationsTable1769566914155';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'seeders',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'batch',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'executed_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('seeders');
  }
}
