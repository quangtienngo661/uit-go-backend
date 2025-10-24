import { DataSource, DataSourceOptions } from "typeorm";
import { config } from 'dotenv';
import { join } from 'path';
import { User } from "../users/entities/user.entity";
import { DriverProfile } from "../users/entities/driver-profile.entity";

// Load .env from project root (absolute path)
config({ path: join(process.cwd(), '.env') });

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.USERDB_HOST,
    port: parseInt(process.env.USERDB_PORT || "5433"),
    username: process.env.USERDB_USERNAME,
    password: process.env.USERDB_PASSWORD,
    database: process.env.USERDB_DATABASE,

    entities: [User, DriverProfile],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: false,
    logging: true,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;