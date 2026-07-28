import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { RequestContextInterceptor } from './common/interceptors/request-context.interceptor';

export async function configureApp() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const isProduction = config.get('NODE_ENV') === 'production';

  app.setGlobalPrefix('api/v1');
  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      validationError: { target: false, value: false },
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter(isProduction));
  app.useGlobalInterceptors(new RequestContextInterceptor());
  app.enableShutdownHooks();

  const allowedOrigins = (config.get<string>('CORS_ORIGINS') ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'Content-Disposition'],
    maxAge: 600,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SUMS API')
    .setDescription('Versioned REST API for the Smart University Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('sums_refresh', { type: 'apiKey', in: 'cookie' })
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
    swaggerOptions: { persistAuthorization: false },
  });

  return { app, document };
}

async function bootstrap() {
  const { app } = await configureApp();
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port, '0.0.0.0');
}

if (require.main === module) {
  void bootstrap();
}
