import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { SupabaseAuthStrategy } from 'nestjs-supabase-auth';
import { ExtractJwt } from 'passport-jwt';
import { createClient, type User as SupabaseUser } from '@supabase/supabase-js';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(SupabaseAuthStrategy, 'supabase') {
  private localSupabase;

  public constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    super({
      supabaseUrl: configService.get<string>('SUPABASE_URL'),
      supabaseKey: configService.get<string>('SUPABASE_KEY'),
      supabaseOptions: {},
      extractor: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });

    this.localSupabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_KEY'),
    );
  }

  // async validate(payload: PayloadType): Promise<ReqUserType> {
  //     if (!payload) { throw new UnauthorizedException('No payload'); }
  //     return {
  //         id: payload.sub,
  //         email: payload.email,
  //         role: 'user',
  //     };
  // }

  async validate(user: SupabaseUser): Promise<any> {
    if (!user?.id) throw new UnauthorizedException('Invalid user');
    return { id: user.id, email: user.email ?? '', role: 'user' };
  }

  async authenticate(req: Request) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) return this.fail('Missing token', 401);

    const { data, error } = await this.localSupabase.auth.getUser(token);
    if (error || !data?.user) return this.fail('Invalid token', 401);

    // Call User microservice via HTTP
    try {
      const userServiceUrl = this.configService.get<string>('USER_SERVICE_URL') || 'http://localhost:3002';
      const response = await firstValueFrom(
        this.httpService.get(`${userServiceUrl}/api/users/email/${data.user.email}`)
      );

      const user = response.data;
      if (!user) return this.fail('User not found in database', 401);

      const roleName = user.role?.name || 'user';
      this.success({ id: data.user.id, email: data.user.email, role: roleName }, null);
    } catch {
      return this.fail('Failed to fetch user from service', 401);
    }
  }
}
