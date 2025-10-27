import { Controller, OnModuleInit, Post, Body, Get, UseGuards, Inject } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ClientGrpc } from '@nestjs/microservices';
import { authPackage, mapVehicleTypeToProto } from '@uit-go-backend/shared';
import { LoginDto, RegisterUserDto, RegisterDriverDto } from './dto';
import { firstValueFrom } from 'rxjs';
import { SupabaseGuard } from '../../guards/auth/supabase.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';

@Controller('auth')
export class AuthController implements OnModuleInit {
  private authServiceClient: authPackage.AuthServiceClient;

  constructor(
    private readonly authService: AuthService,
    @Inject(authPackage.AUTH_SERVICE_NAME) private readonly client: ClientGrpc
  ) {}

  onModuleInit() {
    console.log('Auth module initialized');
    this.authServiceClient = this.client.getService<authPackage.AuthServiceClient>(authPackage.AUTH_SERVICE_NAME);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const response = await firstValueFrom(
      this.authServiceClient.login({
        email: loginDto.email,
        password: loginDto.password,
      })
    );
    return response;
  }

  @Post('register/user')
  async registerUser(@Body() registerDto: RegisterUserDto) {
    const response = await firstValueFrom(
      this.authServiceClient.signUpUser({
        email: registerDto.email,
        password: registerDto.password,
        fullName: registerDto.fullName,
        phone: registerDto.phone,
      })
    );
    return response;
  }

  @Post('register/driver')
  async registerDriver(@Body() registerDto: RegisterDriverDto) {
    const response = await firstValueFrom(
      this.authServiceClient.signUpDriver({
        email: registerDto.email,
        password: registerDto.password,
        fullName: registerDto.fullName,
        phone: registerDto.phone,
        licenseNumber: registerDto.licenseNumber,
        vehicleType: mapVehicleTypeToProto(registerDto.vehicleType),
        licensePlate: registerDto.licensePlate,
        vehicleModel: registerDto.vehicleModel,
        vehicleColor: registerDto.vehicleColor,
      })
    );
    return response;
  }

  @Get('logout')
  @UseGuards(SupabaseGuard)
  async logout() {
    const response = await firstValueFrom(
      this.authServiceClient.logout({})
    );
    return response;
  }

  @Get('check-verification')
  @UseGuards(SupabaseGuard)
  async checkVerification(@CurrentUser() user: { id: string; email: string; role: string }) {
    const response = await firstValueFrom(
      this.authServiceClient.checkVerification({ email: user.email })
    );
    return response;
  }
}
