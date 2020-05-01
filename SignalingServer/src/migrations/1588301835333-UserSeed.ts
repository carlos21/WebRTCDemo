import { MigrationInterface, QueryRunner, getRepository } from "typeorm";
import { User } from "../entity/User";
import { users } from "./seeds/User.seed";

export class UserSeed1588301835333 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        const userRepo = getRepository(User);
        for (const user of users) {
            await userRepo.save(user);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<any> {

    }
}
