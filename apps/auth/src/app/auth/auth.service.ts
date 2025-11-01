import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { authPackage, Role, vehicleTypeToDB } from '@uit-go-backend/shared';
import { firstValueFrom } from 'rxjs';
import { SUPABASE_ADMIN } from '../../supabase/supabase-admin.provider';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    @Inject(SUPABASE_ADMIN) private readonly supabaseAdmin: SupabaseClient
  ) {}

  async login(request: authPackage.LoginRequest): Promise<authPackage.LoginResponse> {
    const { data, error } = await this.supabaseAdmin.auth.signInWithPassword({
      email: request.email,
      password: request.password,
    });

    if (error || !data) {
      throw new Error('Invalid credentials');
    }

    const token = data.session?.access_token || '';

    return { token };
  }

  async signUpUser(request: authPackage.SignUpUserRequest): Promise<authPackage.SignUpUserResponse> {
    const existedUser = await firstValueFrom(this.userClient.send({ cmd: 'findPassengerByEmail' }, request.email));
    if (existedUser) {
      throw new Error('User already exists');
    }

    const { data: users, error: listError } = await this.supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      throw listError;
    }
    if (users.users.find((user) => user.email === request.email)) {
      throw new Error('User already exists');
    }

    const { data, error } = await this.supabaseAdmin.auth.signUp({
      email: request.email,
      password: request.password,
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback',
      },
    });


    if (error || !data) {
      console.error('Supabase signup error:', error);
      throw new Error(`Failed to create user in Supabase: ${error?.message || 'Unknown error'}`);
    }

    const userId = data.user.id;

    await firstValueFrom(this.userClient.send({ cmd: 'createPassenger' }, {
      id: userId,
      email: request.email,
      fullName: request.fullName,
      phone: request.phone,
      role: Role.PASSENGER
    }));

    return { userId };
  }

  async signUpDriver(request: authPackage.SignUpDriverRequest): Promise<authPackage.SignUpDriverResponse> {
    const existedDriver = await firstValueFrom(this.userClient.send({ cmd: 'findDriverByEmail' }, request.email));
    if (existedDriver) {
      throw new Error('Driver already exists');
    }
    const { data: users, error: listError } = await this.supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      throw listError;
    }
    if (users.users.find((user) => user.email === request.email)) {
      throw new Error('Driver already exists');
    }

    const { data, error } = await this.supabaseAdmin.auth.signUp({
      email: request.email,
      password: request.password,
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback',
      },
    });


    if (error || !data) {
      console.error('Supabase signup error:', error);
      throw new Error(`Failed to create driver in Supabase: ${error?.message || 'Unknown error'}`);
    }

    const userId = data.user.id;

    // create the User record with DRIVER role
    await firstValueFrom(this.userClient.send({ cmd: 'createUser' }, {
      id: userId,
      email: request.email,
      fullName: request.fullName,
      phone: request.phone,
      role: Role.DRIVER,
      password: '' // Not used, Supabase manages auth
    }));

    // create the DriverProfile
    const driver = await firstValueFrom(this.userClient.send({ cmd: 'createDriverProfile' }, {
      userId: userId,
      vehicleType: vehicleTypeToDB(request.vehicleType),
      licensePlate: request.licensePlate,
      vehicleModel: request.vehicleModel,
      vehicleColor: request.vehicleColor
    }));

    return { driverId: driver.id, userId: userId };
  }

  async validateToken(request: authPackage.ValidateTokenRequest): Promise<authPackage.ValidateTokenResponse> {
    const { data, error } = await this.supabaseAdmin.auth.getUser(request.token);
    if (error || !data.user) {
      throw new Error('Invalid token');
    }

    const user = await firstValueFrom(
      this.userClient.send({ cmd: 'findOnePassenger' }, data.user.id)
    );

    if (!user) {
      throw new Error('User not found');
    }

    return {
      valid: true,
      userId: data.user.id,
      email: data.user.email || '',
      role: user.role
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async logout(_request: authPackage.LogoutRequest): Promise<authPackage.LogoutResponse> {
    const {error } = await this.supabaseAdmin.auth.signOut();
    if (error) {
      throw new Error('Failed to logout');
    }
    return { success: true };
  }

  async checkVerification(request: authPackage.CheckVerificationRequest): Promise<authPackage.CheckVerificationResponse> {
    const { data: users, error: listError } = await this.supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      throw listError;
    }
    const user = users.users.find((user) => user.email === request.email);
    if (!user) {
      throw new Error('User not found');
    }
    if (user.confirmed_at) {
      await firstValueFrom(this.userClient.send({ cmd: 'markVerified' }, request.email));
    }
    return { isVerified: !!user.confirmed_at };
  }
}
