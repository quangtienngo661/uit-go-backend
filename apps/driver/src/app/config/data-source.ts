import { DataSource, DataSourceOptions } from "typeorm";
import { config } from 'dotenv';
import { join } from 'path';
import { Driver } from "../drivers/entities/driver.entity";

// Load .env file with absolute path
config({ path: join(process.cwd(), '.env') });

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DRIVERDB_HOST,
    port: parseInt(process.env.DRIVERDB_PORT || "5435"),
    username: process.env.DRIVERDB_USERNAME,
    password: process.env.DRIVERDB_PASSWORD,
    database: process.env.DRIVERDB_DATABASE,
    entities: [Driver],
    synchronize: true, // development only
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    logging: true
}

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
