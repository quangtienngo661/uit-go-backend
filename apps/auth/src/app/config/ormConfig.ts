import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm'

export const authDbAsynConfig: TypeOrmModuleAsyncOptions = {
    imports: [ConfigModule], 
    inject: [ConfigService], 
    useFactory: (configService: ConfigService) => ({
        // host
    })
}