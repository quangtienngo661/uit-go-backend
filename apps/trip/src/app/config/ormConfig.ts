import { ConfigModule, ConfigService } from "@nestjs/config";
import { Trip } from "../trips/entities/trip.entity";
import { TypeOrmModuleAsyncOptions } from "@nestjs/typeorm";
import { Rating } from "../trips/entities/rating.entity";

export const tripDbAsyncConfig: TypeOrmModuleAsyncOptions = {
    imports: [ConfigModule], 
    inject: [ConfigService], 
    useFactory: (configService: ConfigService) => ({
        type: 'postgres', 
        host: configService.get('TRIPDB_HOST'),
        port: +configService.get('TRIPDB_PORT'),
        username: configService.get('TRIPDB_USERNAME'),
        password: configService.get('TRIPDB_PASSWORD'),
        database: configService.get('TRIPDB_DATABASE'),
        entities: [Trip, Rating], 
        migrationsRun: false, // Don't auto run (use CLI instead), 
        logging: true, 
    })
};