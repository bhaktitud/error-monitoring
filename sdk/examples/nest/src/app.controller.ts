import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  
  @Get('error')
  triggerError(): string {
    throw new Error('Ini adalah error yang disengaja untuk menguji LogRaven SDK');
  }
} 