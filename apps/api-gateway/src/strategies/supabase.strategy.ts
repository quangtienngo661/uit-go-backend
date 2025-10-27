import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { SupabaseAuthStrategy } from 'nestjs-supabase-auth';
import { ExtractJwt } from 'passport-jwt';
import { createClient, type User as SupabaseUser } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(SupabaseAuthStrategy, 'supabase') {
  private localSupabase;

  public constructor(
    private readonly configService: ConfigService,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async validate(user: SupabaseUser): Promise<any> {
    if (!user?.id) throw new UnauthorizedException('Invalid user');
    return { id: user.id, email: user.email ?? '', role: 'user' };
  }

  async authenticate(req: Request) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) return this.fail('Missing token', 401);

    const { data, error } = await this.localSupabase.auth.getUser(token);
    if (error || !data?.user) return this.fail('Invalid token', 401);

    // Call User microservice to get user's role from database
    try {
      const user = await firstValueFrom(
        this.userClient.send({ cmd: 'findUserByEmail' }, data.user.email)
      );
      if (!user) return this.fail('User not found in database', 401);

      // Return user with role from database
      return this.success({
        id: data.user.id,
        email: data.user.email,
        role: user.role
      }, null);
    } catch {
      return this.fail('Failed to fetch user from service', 401);
    }
  }
}
