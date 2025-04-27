import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseDto } from '@/common/dto/response.dto';

export function setupSwagger(app: INestApplication) {
  const swaggerConfig = new DocumentBuilder()
    .setTitle(process.env.SWAGGER_TITLE)
    .setDescription(process.env.SWAGGER_DESCRIPTION)
    .setVersion(process.env.SWAGGER_VERSION)
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

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    extraModels: [ResponseDto],
    deepScanRoutes: true,
  });

  SwaggerModule.setup(process.env.SWAGGER_PATH, app, document, {
    jsonDocumentUrl: process.env.SWAGGER_JSON,
    swaggerOptions: {
      // docExpansion: 'none', // group 닫기
      persistAuthorization: true, // 새로고침 토큰 유지
    },
  });
}
