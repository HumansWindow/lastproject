import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';
import { UserRole } from '../users/enums/user-role.enum';

export class InitialMigration1710000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create UUID extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create users table
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
                        isUnique: true
                    },
                    {
                        name: 'role',
                        type: 'enum',
                        enum: Object.values(UserRole),
                        default: `'${UserRole.USER}'`
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

        // Create wallets table
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
                        type: 'varchar'
                    },
                    {
                        name: 'chain',
                        type: 'varchar'
                    },
                    {
                        name: 'userId',
                        type: 'uuid'
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP'
                    }
                ]
            }),
            true
        );

        // Add foreign keys
        await queryRunner.createForeignKey(
            'users',
            new TableForeignKey({
                columnNames: ['referrerId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'SET NULL'
            })
        );

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
        await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
    }
}
