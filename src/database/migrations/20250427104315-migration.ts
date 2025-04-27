import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class Migration20250427193400 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'social_logins',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'type',
            type: 'varchar',
          },
          {
            name: 'sid',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
    );

    await queryRunner.dropColumns('users', [
      'state',
      'name',
      'gender',
      'phone',
      'email',
    ]);

    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'nickName',
        type: 'varchar',
      }),
      new TableColumn({
        name: 'cookingLevel',
        type: 'varchar',
      }),
      new TableColumn({
        name: 'householdType',
        type: 'varchar',
      }),
      new TableColumn({
        name: 'job',
        type: 'varchar',
      }),
      new TableColumn({
        name: 'socialLogin_id',
        type: 'int',
        isUnique: true,
        isNullable: true,
      }),
    ]);

    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['socialLogin_id'],
        referencedTableName: 'social_logins',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('socialLogin_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('users', foreignKey);
    }

    await queryRunner.dropColumns('users', [
      'nickName',
      'cookingLevel',
      'householdType',
      'job',
      'socialLogin_id',
    ]);

    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'state',
        type: 'varchar',
        default: "'Activation'",
      }),
      new TableColumn({
        name: 'name',
        type: 'varchar',
      }),
      new TableColumn({
        name: 'gender',
        type: 'varchar',
        default: "'Unknown'",
      }),
      new TableColumn({
        name: 'phone',
        type: 'varchar',
        isUnique: true,
        isNullable: true,
      }),
      new TableColumn({
        name: 'email',
        type: 'varchar',
        isUnique: true,
        isNullable: true,
      }),
    ]);

    await queryRunner.dropTable('social_logins');
  }
}
