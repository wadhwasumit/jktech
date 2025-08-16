import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Document Service API')
    .setDescription('API documentation for Document Service')
    .setVersion('1.0')
    .addTag('Documents')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3006);

   // Attach the TCP microservice to the same instance (Avoids multiple processes)
   app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: 4001 }, // Use a different port for TCP
  });

  await app.startAllMicroservices();
}
bootstrap();
