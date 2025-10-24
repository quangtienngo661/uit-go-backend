import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'authPackage',
          protoPath: join(process.cwd(), 'libs/shared/src/lib/protos/auth.proto'),
          url: '0.0.0.0:3001'
        }
      }
    ])
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule { }
