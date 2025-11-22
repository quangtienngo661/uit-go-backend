import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTripSchema1763743947931 implements MigrationInterface {
    name = 'UpdateTripSchema1763743947931'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trips" DROP COLUMN "estimated_duration"`);
        await queryRunner.query(`ALTER TABLE "trips" ADD "estimated_duration" numeric(10,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trips" DROP COLUMN "estimated_duration"`);
        await queryRunner.query(`ALTER TABLE "trips" ADD "estimated_duration" integer`);
    }

}
