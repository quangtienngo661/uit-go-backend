import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { authPackage, Role } from '@uit-go-backend/shared';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy
  ) {}

  async login(request: authPackage.LoginRequest): Promise<authPackage.LoginResponse> {
    // TODO: Implement login logic
    // 1. Validate credentials with Supabase
    // 2. Return JWT token

    throw new Error('Method not implemented.');
  }

  async signUpUser(request: authPackage.SignUpUserRequest): Promise<authPackage.SignUpUserResponse> {
    // TODO: Implement user signup logic
    // 1. Create user in Supabase (signUp)
    // 2. Get the Supabase user ID
    // 3. Call User service TCP to create user record with role: Role.PASSENGER
    // 4. Return user ID
    
    // Example User service call:
    // const userRecord = await firstValueFrom(
    //   this.userClient.send({ cmd: 'createUser' }, {
    //     email: request.email,
    //     password: request.password,
    //     fullName: request.fullName,
    //     phone: request.phone,
    //     role: Role.PASSENGER
    //   })
    // );
    
    throw new Error('Method not implemented.');
  }

  async signUpDriver(request: authPackage.SignUpDriverRequest): Promise<authPackage.SignUpDriverResponse> {
    // TODO: Implement driver signup logic
    // 1. Create user in Supabase (signUp)
    // 2. Get the Supabase user ID
    // 3. Call User service TCP to create user record with role: Role.DRIVER + vehicle info
    // 4. Return user ID
    
    // Example User service call:
    // const driverRecord = await firstValueFrom(
    //   this.userClient.send({ cmd: 'createUser' }, {
    //     email: request.email,
    //     password: request.password,
    //     fullName: request.fullName,
    //     phone: request.phone,
    //     role: Role.DRIVER,
    //     vehicleType: request.vehicleType,
    //     licensePlate: request.licensePlate,
    //     vehicleModel: request.vehicleModel
    //   })
    // );
    
    throw new Error('Method not implemented.');
  }

  async validateToken(request: authPackage.ValidateTokenRequest): Promise<authPackage.ValidateTokenResponse> {
    // TODO: Implement token validation
    // 1. Verify JWT token with Supabase
    // 2. Return user info if valid
    throw new Error('Method not implemented.');
  }

  async logout(request: authPackage.LogoutRequest): Promise<authPackage.LogoutResponse> {
    // TODO: Implement logout logic
    // 1. Invalidate token in Supabase
    // 2. Return success status
    throw new Error('Method not implemented.');
  }
}
