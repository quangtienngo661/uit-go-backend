import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialTripSchema1763707138952 implements MigrationInterface {
    name = 'InitialTripSchema1763707138952'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "ratings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rated_by" uuid NOT NULL, "rated_user" uuid NOT NULL, "rater_role" character varying(20) NOT NULL, "rating" integer NOT NULL, "comment" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "trip_id" uuid NOT NULL, CONSTRAINT "PK_0f31425b073219379545ad68ed9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_ratings_rater_role" ON "ratings" ("rater_role") `);
        await queryRunner.query(`CREATE INDEX "idx_ratings_rated_user" ON "ratings" ("rated_user") `);
        await queryRunner.query(`CREATE INDEX "idx_ratings_trip_id" ON "ratings" ("trip_id") `);
        await queryRunner.query(`CREATE TABLE "trips" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "passenger_id" uuid NOT NULL, "potential_drivers" text array NOT NULL DEFAULT '{}', "driver_id" uuid, "pickup_lat" numeric(10,8) NOT NULL, "pickup_lng" numeric(11,8) NOT NULL, "pickup_address" text NOT NULL, "dropoff_lat" numeric(10,8) NOT NULL, "dropoff_lng" numeric(11,8) NOT NULL, "dropoff_address" text NOT NULL, "vehicle_type" character varying(50) NOT NULL, "trip_status" character varying(20) NOT NULL DEFAULT 'searching', "distance_km" numeric(6,2), "estimated_price" numeric(10,2), "final_price" numeric(10,2), "estimated_duration" integer, "route_geometry" jsonb, "cancelled_by" character varying(20), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "accepted_at" TIMESTAMP, "completed_at" TIMESTAMP, "cancelled_at" TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f71c231dee9c05a9522f9e840f5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_trips_searching" ON "trips" ("trip_status", "created_at") WHERE trip_status = 'searching'`);
        await queryRunner.query(`CREATE INDEX "idx_trips_created_at" ON "trips" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_trips_status" ON "trips" ("trip_status") `);
        await queryRunner.query(`CREATE INDEX "idx_trips_driver_id" ON "trips" ("driver_id") WHERE driver_id IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "idx_trips_passenger_id" ON "trips" ("passenger_id") `);
        await queryRunner.query(`ALTER TABLE "ratings" ADD CONSTRAINT "FK_9433e63629915a4e102a3462b74" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ratings" DROP CONSTRAINT "FK_9433e63629915a4e102a3462b74"`);
        await queryRunner.query(`DROP INDEX "public"."idx_trips_passenger_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_trips_driver_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_trips_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_trips_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_trips_searching"`);
        await queryRunner.query(`DROP TABLE "trips"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ratings_trip_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ratings_rated_user"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ratings_rater_role"`);
        await queryRunner.query(`DROP TABLE "ratings"`);
    }

}
