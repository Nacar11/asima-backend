import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMetadataToPasswordResetTokens1767300000000
  implements MigrationInterface
{
  name = 'AddMetadataToPasswordResetTokens1767300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add metadata column to password_reset_tokens table
    await queryRunner.addColumn(
      'password_reset_tokens',
      new TableColumn({
        name: 'metadata',
        type: 'jsonb',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop metadata column
    await queryRunner.dropColumn('password_reset_tokens', 'metadata');
  }
}
