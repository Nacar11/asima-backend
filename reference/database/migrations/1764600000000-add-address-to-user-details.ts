import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAddressToUserDetails1764600000000
  implements MigrationInterface
{
  name = 'AddAddressToUserDetails1764600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user_details',
      new TableColumn({
        name: 'address',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user_details', 'address');
  }
}
