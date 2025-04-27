import { Table } from 'typeorm';

module.exports = class Migration20250418141423 {
  async up(queryRunner) {
    await queryRunner.createTable(
      new Table({
        name: 'logins',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'uuid', type: 'varchar', isUnique: true, default: 'UUID()' },
          { name: 'state', type: 'varchar', default: "'Activation'" },
          { name: 'passid', type: 'varchar', isUnique: true },
          { name: 'password', type: 'varchar' },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          { name: 'deletedAt', type: 'datetime', isNullable: true },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'uuid', type: 'varchar', isUnique: true, default: 'UUID()' },
          { name: 'state', type: 'varchar', default: "'Activation'" },
          { name: 'name', type: 'varchar' },
          { name: 'gender', type: 'varchar', default: "'Unknown'" },
          { name: 'phone', type: 'varchar', isUnique: true, isNullable: true },
          { name: 'email', type: 'varchar', isUnique: true, isNullable: true },
          { name: 'login_id', type: 'int', isUnique: true, isNullable: true },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          { name: 'deletedAt', type: 'datetime', isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ['login_id'],
            referencedTableName: 'logins',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
    );
  }

  async down(queryRunner) {
    await queryRunner.dropTable('users');
    await queryRunner.dropTable('logins');
  }
};
