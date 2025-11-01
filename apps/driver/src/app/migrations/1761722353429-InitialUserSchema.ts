import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialUserSchema1761722353429 implements MigrationInterface {
    name = 'InitialUserSchema1761722353429'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "drivers" ("id" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'offline', "current_lat" numeric(10,8), "current_lng" numeric(11,8), "last_location_update" TIMESTAMP, "current_trip_id" uuid, "stats_date" date NOT NULL DEFAULT ('now'::text)::date, "daily_trips" integer NOT NULL DEFAULT '0', "daily_revenue" numeric(10,2) NOT NULL DEFAULT '0', "last_active_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_92ab3fb69e566d3eb0cae896047" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "drivers"`);
    }

}
