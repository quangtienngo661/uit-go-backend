import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis'

export const REDIS_CLIENT = 'REDIS_CLIENT'

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: REDIS_CLIENT,
            inject: [ConfigService],
            useFactory(configService: ConfigService) {
                const client = new Redis({
                    host: configService.get('REDIS_HOST'),
                    port: configService.get('REDIS_PORT')
                });
                return client;
            },
        }
    ],
    exports: [REDIS_CLIENT]
})
export class RedisModule { }
