import { ResponseDto } from '@/common/dto/response.dto';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle(process.env.SWAGGER_TITLE || 'API')
    .setDescription(process.env.SWAGGER_DESCRIPTION || 'API documentation')
    .setVersion(process.env.SWAGGER_VERSION || '1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'Authorization',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ResponseDto],
    deepScanRoutes: true,
  });

  // FIXME
  if (process.env.NODE_ENV !== 'development') {
    if (document.paths && document.paths['/v1/auth/debug']) {
      delete document.paths['/v1/auth/debug'];
    }
  }

  const path = process.env.SWAGGER_PATH || '/docs'; // e.g. "/docs"
  SwaggerModule.setup(path, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
