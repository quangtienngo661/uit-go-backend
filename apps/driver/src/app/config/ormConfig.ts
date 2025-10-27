import { ConfigModule, ConfigService } from "@nestjs/config";
import { Driver } from "../drivers/entities/driver.entity";
import { TypeOrmModuleAsyncOptions } from "@nestjs/typeorm";

export const driverDbAsyncConfig: TypeOrmModuleAsyncOptions = {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DRIVERDB_HOST'),
        port: +configService.get('DRIVERDB_PORT'),
        username: configService.get('DRIVERDB_USERNAME'),
        password: configService.get('DRIVERDB_PASSWORD'),
        database: configService.get('DRIVERDB_DATABASE'),
        entities: [Driver],
        synchronize: false, // development only
        migrationsRun: false, // Don't auto run (use CLI instead),
        logging: true,
    })
};
