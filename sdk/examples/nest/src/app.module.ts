import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { init, LogRavenExceptionFilter, LogRavenInterceptor } from '@lograven/sdk';

// Inisialisasi LogRaven SDK
init({
  dsn: '6369f64f-261b-4b3e-bd7c-309127deaf3a',
  environment: 'development',
  release: 'example-0.1.0',
  apiUrl: 'http://localhost:3000',
});

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService
  ],
})
export class AppModule {
  constructor() {
    console.log('LogRaven SDK initialized');
  }
} 