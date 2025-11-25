import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  ping() {
    return { status: 'not ok', version: process.env.APP_VERSION ?? 'dev' };
  }
}
