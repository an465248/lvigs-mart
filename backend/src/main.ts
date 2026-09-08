import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: ["error", "warn", "log"],
  });
  app.setGlobalPrefix("api");

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: (
      process.env.WEB_ORIGIN ||
      "http://localhost:3000,http://127.0.0.1:3000"
    ).split(","),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "X-Requested-With",
      "X-Request-Id",
    ],
    credentials: true,
    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("LVIGS Mart API")
    .setDescription("REST + WebSocket API for the LVIGS Mart platform")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, doc);

  // Enable shutdown hooks
  app.enableShutdownHooks();

  const port = parseInt(process.env.PORT || "4000", 10);
  await app.listen(port, "0.0.0.0");

  console.log(`[LVIGS] API ready at http://localhost:${port}/api`);
  console.log(`[LVIGS] Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
