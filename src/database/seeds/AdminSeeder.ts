import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { UserEntity } from '@/database/entity/user.entity';
import { LoginEntity } from '@/database/entity/login.entity';
import * as bcrypt from 'bcrypt';

export default class AdminSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const exists = await dataSource.getRepository(LoginEntity).findOneBy({
      passid: 'admin',
    });
    if (exists) return;

    await dataSource.transaction(async (manager) => {
      const hashed = await bcrypt.hash('recipot1!11', 10);

      const login = manager.getRepository(LoginEntity).create({
        passid: 'admin',
        password: hashed,
        // state: 'Activation',
      });
      await manager.getRepository(LoginEntity).save(login);

      const user = manager.getRepository(UserEntity).create({
        nickName: 'admin',
        cookingLevel: 'admin',
        householdType: 'admin',
        job: 'admin',
        login,
        // state: 'Activation',
      });
      await manager.getRepository(UserEntity).save(user);
    });
  }
}
