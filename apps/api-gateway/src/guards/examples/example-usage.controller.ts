import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { SupabaseGuard } from '../../guards/auth/supabase.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('example')
export class ExampleController {

  // Public endpoint - no authentication required
  @Get('public')
  getPublic() {
    return { message: 'This is public' };
  }

  // Any authenticated user (both passenger and driver)
  @UseGuards(SupabaseGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Authenticated user profile',
      user
    };
  }

  // Only for passengers
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles('passenger')
  @Post('book-trip')
  bookTrip(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Trip booked',
      userId: user.id
    };
  }

  // Only for drivers
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles('driver')
  @Post('accept-trip')
  acceptTrip(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Trip accepted',
      driverId: user.id
    };
  }

  // For both passengers and drivers
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles('passenger', 'driver')
  @Get('chat')
  getChat(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Chat messages',
      role: user.role
    };
  }

  // Admin only (if you add admin role later)
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles('admin')
  @Get('admin-dashboard')
  adminDashboard() {
    return { message: 'Admin dashboard' };
  }
}
