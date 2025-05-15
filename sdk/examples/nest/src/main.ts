import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LogRavenExceptionFilter, LogRavenInterceptor } from '@lograven/sdk';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Menambahkan LogRaven Exception Filter secara global
  app.useGlobalFilters(new LogRavenExceptionFilter());
  
  // Menambahkan LogRaven Interceptor secara global
  app.useGlobalInterceptors(new LogRavenInterceptor());
  
  await app.listen(5555);
  console.log('Application is running on: http://localhost:5555');
}
bootstrap(); 