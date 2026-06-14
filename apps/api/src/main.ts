import "reflect-metadata";
// Bootstrap OpenTelemetry before anything else.
import { registerOTel } from "./tracing";
registerOTel();

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // All routes are served under /api to match the original API surface.
  app.setGlobalPrefix("api");

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    allowedHeaders: ["Content-Type", "x-targeting-key", "If-None-Match"],
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  console.log(`toggle-shop API listening on http://localhost:${port}`);
}

void bootstrap();
