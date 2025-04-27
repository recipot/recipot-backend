import { Table } from 'typeorm';

module.exports = class Migration20250418141503 {
  async up(queryRunner) {
    await queryRunner.createTable(
      new Table({
        name: 'boards',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'title', type: 'varchar' },
          { name: 'content', type: 'text' },
          { name: 'createdBy', type: 'int' },
          { name: 'updatedBy', type: 'int', isNullable: true },
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
            columnNames: ['createdBy'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['updatedBy'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
    );
  }

  async down(queryRunner) {
    await queryRunner.dropTable('boards');
  }
};
