import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { authPackage } from '@uit-go-backend/shared';

@Controller()
@authPackage.AuthServiceControllerMethods()
export class AuthController implements authPackage.AuthServiceController {
  constructor(private readonly authService: AuthService) {}

  async login(request: authPackage.LoginRequest): Promise<authPackage.LoginResponse> {
    return this.authService.login(request);
  }

  async signUpUser(request: authPackage.SignUpUserRequest): Promise<authPackage.SignUpUserResponse> {
    return this.authService.signUpUser(request);
  }

  async signUpDriver(request: authPackage.SignUpDriverRequest): Promise<authPackage.SignUpDriverResponse> {
    return this.authService.signUpDriver(request);
  }

  async validateToken(request: authPackage.ValidateTokenRequest): Promise<authPackage.ValidateTokenResponse> {
    return this.authService.validateToken(request);
  }

  async logout(request: authPackage.LogoutRequest): Promise<authPackage.LogoutResponse> {
    return this.authService.logout(request);
  }

  async checkVerification(request: authPackage.CheckVerificationRequest): Promise<authPackage.CheckVerificationResponse> {
    return this.authService.checkVerification(request);
  }

}
