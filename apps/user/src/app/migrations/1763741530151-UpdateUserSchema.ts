import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserSchema1763741530151 implements MigrationInterface {
    name = 'UpdateUserSchema1763741530151'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "password_hash" TO "password"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "password" TO "password_hash"`);
    }

}
