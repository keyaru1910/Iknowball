import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import { AppModule } from './app.module';
import { validateEnvironment } from './config/env.validation';

async function bootstrap() {
  // 1. Kiểm tra và thẩm định biến môi trường trước khi khởi động
  validateEnvironment();

  const app = await NestFactory.create(AppModule, {
    // Thu thập raw body để xác thực chữ ký Webhook (ví dụ Stripe)
    rawBody: true,
  });

  // 2. Bảo mật HTTP Headers với Helmet và CSP
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          scriptSrc: ["'self'", 'https://js.stripe.com'],
          frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
          connectSrc: ["'self'", 'https://api.stripe.com', process.env.FRONTEND_URL || 'http://localhost:3000'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 3. Cookie Parser cho Refresh Token an toàn
  app.use(cookieParser());

  // 4. Cấu hình CORS Allowlist nghiêm ngặt
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001',
    'https://iknowball.vercel.app',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Chặn bởi chính sách CORS'));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'stripe-signature'],
  });

  // 5. Global Validation Pipe với strict whitelist
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`[iKnowBall] Backend server is running on http://localhost:${port}`);
}

void bootstrap();
