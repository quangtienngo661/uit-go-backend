import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialUserSchema1761899763202 implements MigrationInterface {
    name = 'InitialUserSchema1761899763202'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trips" ADD "potential_drivers" text array NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trips" DROP COLUMN "potential_drivers"`);
    }

}
