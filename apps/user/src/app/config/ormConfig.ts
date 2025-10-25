import { ConfigModule, ConfigService } from "@nestjs/config";

import { TypeOrmModuleAsyncOptions } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { DriverProfile } from "../users/entities/driver-profile.entity";


export const userDbAsyncConfig: TypeOrmModuleAsyncOptions = {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('USERDB_HOST'),
        port: +configService.get('USERDB_PORT'),
        username: configService.get('USERDB_USERNAME'),
        password: configService.get('USERDB_PASSWORD'),
        database: configService.get('USERDB_DATABASE'),
        entities: [User, DriverProfile],

        synchronize: false,
        migrations: [__dirname + '/../migrations/*{.ts, .js}'],
        migrationsRun: false, // Don't auto run (use CLI instead)
        logging: true,
    })
};
