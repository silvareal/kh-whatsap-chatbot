import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthGuard } from './guards/auth.guard';
import { Reflector } from '@nestjs/core';
import { LoggerErrorInterceptor } from 'nestjs-pino';
import { Logger } from 'nestjs-pino';
import * as compression from 'compression';

async function bootstrap() {
  process.env.TZ = 'Africa/Lagos'; // Set default timezone

  const app = await NestFactory.create(AppModule);

  const logger = app.get(Logger);

  // app.useBodyParser('json', { limit: '50mb' });
  app.use(compression());

  // logger
  // app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors();
  app.setGlobalPrefix('api/v1');

  app.useGlobalGuards(new AuthGuard(app.get(Reflector)));
  app.useLogger(logger);
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     transform: true,
  //     transformOptions: {
  //       enableImplicitConversion: true,
  //       exposeDefaultValues: true,
  //       exposeUnsetFields: false,
  //     },
  //     enableDebugMessages: IS_DEVELOPMENT,
  //     whitelist: true,
  //   }),
  // );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
