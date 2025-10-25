import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { authConfigValidation, configuration } from './config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { authDbAsynConfig } from './config/ormConfig';

@Module({
  imports: [
    // AuthModule,
    // ConfigModule.forRoot({
    //   envFilePath: '../../../.env',
    //   load: [configuration],
    //   isGlobal: true,
    //   validationSchema: authConfigValidation,
    //   cache: true
    // }),
    // TypeOrmModule.forRootAsync(authDbAsynConfig)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
