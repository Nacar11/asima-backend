import 'dotenv/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import { AppModule } from '@/app.module';
import validationOptions from '@/utils/validation-options';
import { AllConfigType } from '@/config/config.type';
import { ResolvePromisesInterceptor } from '@/utils/serializer.interceptor';
import { SafeSerializerInterceptor } from '@/interceptors/safe-serializer.interceptor';
import { ApplicationLoggerService } from '@/loggers/services/application.logger.service';
import { QueryFailedFilter } from '@/utils/helpers/exception.helper';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { CleanEntityInterceptor } from '@/interceptors/clean-entity.interceptor';
import { LoggingInterceptor } from '@/monitoring/interceptors/logging.interceptor';
import { MetricsService } from '@/monitoring/services/metrics.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  // Configure WebSocket adapter for Socket.io
  app.useWebSocketAdapter(new IoAdapter(app));

  app.use(helmet());

  app.useGlobalFilters(new QueryFailedFilter());
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  // Configure CORS to allow credentials.
  // CORS_ALLOWED_ORIGINS: comma-separated list (supports multiple origins).
  // Falls back to FRONTEND_DOMAIN (single value) if CORS_ALLOWED_ORIGINS is not set.
  const corsOriginsRaw =
    configService.get('app.corsAllowedOrigins', { infer: true }) ||
    configService.get('app.frontendDomain', { infer: true });
  const allowedOrigins = corsOriginsRaw
    ? corsOriginsRaw
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
    : ['http://localhost:3000'];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-csrf-token',
      'x-custom-lang',
    ],
  });

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  // Get services for LoggingInterceptor
  const applicationLoggerService = app.get(ApplicationLoggerService);
  const metricsService = app.get(MetricsService);
  const loggingInterceptor = new LoggingInterceptor(
    applicationLoggerService,
    metricsService,
  );

  app.useGlobalInterceptors(
    // ResolvePromisesInterceptor is used to resolve promises in responses because class-transformer can't do it
    // https://github.com/typestack/class-transformer/issues/549
    new ResolvePromisesInterceptor(),
    new SafeSerializerInterceptor(),
    loggingInterceptor, // Request/response logging
    new CleanEntityInterceptor(),
  );

  // Logger
  app.useLogger(app.get(ApplicationLoggerService));

  const appName = configService.getOrThrow('app.name', { infer: true });

  const nodeEnv = configService.getOrThrow('app.nodeEnv', { infer: true });

  if (nodeEnv !== 'production') {
    const options = new DocumentBuilder()
      .setTitle(appName)
      .setDescription(`${appName} Docs`)
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        filter: true,
        showRequestDuration: true,
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  app.use(cookieParser());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  await app.listen(
    configService.getOrThrow('app.port', { infer: true }),
    '0.0.0.0',
  );
}
void bootstrap();
