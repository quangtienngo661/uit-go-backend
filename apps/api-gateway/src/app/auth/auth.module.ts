import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { authPackage } from '@uit-go-backend/shared';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: authPackage.AUTH_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          package: authPackage.AUTH_PACKAGE_PACKAGE_NAME,
          url: 'auth-service:3001',
          protoPath: join(process.cwd(), 'libs/shared/src/lib/protos/auth.proto')
        }
      }
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule { }
