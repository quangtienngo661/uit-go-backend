import { DataSource, DataSourceOptions } from "typeorm";
import { config } from 'dotenv';
import { join } from 'path';
import { Trip } from "../trips/entities/trip.entity";
import { Rating } from "../trips/entities/rating.entity";

// Load .env file with absolute path
config({ path: join(process.cwd(), '.env') });

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.TRIPDB_HOST,
    port: parseInt(process.env.TRIPDB_PORT || "5434"),  // Fixed: was USERDB_PORT
    username: process.env.TRIPDB_USERNAME,
    password: process.env.TRIPDB_PASSWORD,
    database: process.env.TRIPDB_DATABASE,
    entities: [Trip, Rating], 
    synchronize: false, 
    migrations: [__dirname + '/../migrations/*{.ts, .js}'], 
    logging: true
}

const dataSource = new DataSource(dataSourceOptions); 
export default dataSource;