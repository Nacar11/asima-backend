import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllConfigType } from '@/config/config.type';
import validationOptions from '@/utils/validation-options';
import { QueryFailedFilter } from '@/utils/helpers/exception.helper';
import { applySwaggerSchemaGroups } from '@/utils/swagger/schema-groups';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const configService = app.get(ConfigService<AllConfigType>);

  const apiPrefix = configService.getOrThrow('app.apiPrefix', { infer: true });
  const port = configService.getOrThrow('app.port', { infer: true });
  const nodeEnv = configService.getOrThrow('app.nodeEnv', { infer: true });
  const corsRaw = configService.get('app.corsAllowedOrigins', { infer: true });
  const allowedOrigins = corsRaw
    ?.split(',')
    .map((s: string) => s.trim())
    .filter(Boolean) ?? ['http://localhost:3000'];

  app.use(helmet());
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.setGlobalPrefix(apiPrefix, { exclude: ['/'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalFilters(new QueryFailedFilter());

  if (nodeEnv !== 'production') {
    const docs = new DocumentBuilder()
      .setTitle('asima-backend')
      .setDescription('Ashima-inspired Employee Time Management — API')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = applySwaggerSchemaGroups(SwaggerModule.createDocument(app, docs), [
      {
        name: 'Auth',
        schemas: [
          'LoginDto',
          'LoginResponseDto',
          'RefreshResponseDto',
          'AuthUserDto',
          'AuthRoleDto',
        ],
      },
      {
        name: 'Admin - User',
        schemas: [
          'User',
          'UserResponseDto',
          'UserRoleSummaryDto',
          'CreateUserDto',
          'UpdateUserDto',
          'ResetUserPasswordDto',
        ],
      },
      { name: 'User', schemas: ['UpdateMeDto', 'ChangeMyPasswordDto'] },
      {
        name: 'Admin - Role',
        schemas: ['Role', 'CreateRoleDto', 'UpdateRoleDto', 'AssignPermissionsDto'],
      },
      {
        name: 'Admin - Permission',
        schemas: ['Permission', 'UpdatePermissionDto'],
      },
      {
        name: 'Admin - Time Entry',
        schemas: ['TimeEntry', 'CreateTimeEntryDto', 'UpdateTimeEntryDto', 'QueryTimeEntryDto'],
      },
      { name: 'Time Entry', schemas: ['QueryMyTimeEntryDto'] },
      {
        name: 'Admin - Work Schedule',
        schemas: [
          'WorkSchedule',
          'CreateWorkScheduleDto',
          'UpdateWorkScheduleDto',
          'QueryWorkScheduleDto',
        ],
      },
      {
        name: 'Admin - Compensation',
        schemas: ['Compensation', 'CreateCompensationDto'],
      },
      {
        name: 'Approvals',
        schemas: ['PendingApproval', 'QueryPendingApprovalsDto'],
      },
    ]);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(port, '0.0.0.0');
  Logger.log(`asima-backend listening on http://localhost:${port}/${apiPrefix}/v1`, 'Bootstrap');
  if (nodeEnv !== 'production') {
    Logger.log(`Swagger UI at http://localhost:${port}/docs`, 'Bootstrap');
  }
}

void bootstrap();
