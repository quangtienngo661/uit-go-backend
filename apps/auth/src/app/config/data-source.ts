import { DataSource, DataSourceOptions } from "typeorm";
import { config } from "dotenv"
import { join } from "path";

config({ path: join(process.cwd(), '.env') });

const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.AUTHDB_HOST, 
    port: parseInt(process.env.AUTHDB_PORT || "5432"), 
    username: process.env.AUTHDB_USERNAME,
    password: process.env.AUTHDB_PASSWORD,
    database: process.env.AUTHDB_DATABASE, 
    migrations: [__dirname + '/../migrations/*{.ts, .js}'], 
    synchronize: false, 
    logging: true
    // entities:
}

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;