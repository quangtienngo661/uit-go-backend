import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTripSchema1761905766565 implements MigrationInterface {
    name = 'UpdateTripSchema1761905766565'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trips" ALTER COLUMN "potential_drivers" SET DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trips" ALTER COLUMN "potential_drivers" DROP DEFAULT`);
    }

}
