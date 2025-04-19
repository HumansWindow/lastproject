import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class UpdateUserAndWalletEntities1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'walletAddress',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'role',
            type: 'varchar',
            default: "'user'"
          },
          {
            name: 'referralCode',
            type: 'varchar',
            isNullable: true
          },
          {
            name: 'referrerId',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'lastLoginAt',
            type: 'timestamp',
            isNullable: true
          }
        ]
      }),
      true
    );

    // Create Wallets table
    await queryRunner.createTable(
      new Table({
        name: 'wallets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'address',
            type: 'varchar',
          },
          {
            name: 'chain',
            type: 'varchar',
          },
          {
            name: 'blockchain',
            type: 'varchar',
          },
          {
            name: 'provider',
            type: 'varchar',
          },
          {
            name: 'userId',
            type: 'uuid'
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'lastUsedAt',
            type: 'timestamp',
            isNullable: true
          }
        ]
      }),
      true
    );

    // Add foreign key for referrerId in users table
    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['referrerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL'
      })
    );

    // Add foreign key for userId in wallets table
    await queryRunner.createForeignKey(
      'wallets',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE'
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('wallets');
    await queryRunner.dropTable('users');
  }
}
