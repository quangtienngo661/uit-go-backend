import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { configuration, userConfigValidation } from './config/configuration';
import { userDbAsyncConfig } from './config/ormConfig';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
   imports: [
    ConfigModule.forRoot({
      envFilePath: '../../../.env',
      isGlobal: true,
      cache: true,
      load: [configuration],
      validationSchema: userConfigValidation
    }),
    UsersModule,
    TypeOrmModule.forRootAsync(userDbAsyncConfig)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
