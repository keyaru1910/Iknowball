import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Có lỗi xảy ra trên hệ thống. Vui lòng thử lại sau.';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        code = `HTTP_${status}`;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        if (Array.isArray(resObj.message)) {
          message = resObj.message.join(', ');
        } else if (resObj.message) {
          message = String(resObj.message);
        }
        code = resObj.error || `HTTP_${status}`;
        details = resObj.details || null;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
      message = exception.message || message;
    }

    // Tùy biến thông điệp thân thiện theo status code
    if (status === HttpStatus.UNAUTHORIZED && message === 'Unauthorized') {
      message = 'Vui lòng đăng nhập để thực hiện chức năng này.';
      code = 'UNAUTHORIZED';
    } else if (status === HttpStatus.FORBIDDEN && message === 'Forbidden') {
      message = 'Bạn không có quyền truy cập chức năng này.';
      code = 'FORBIDDEN';
    }

    response.status(status).json({
      data: null,
      meta: null,
      error: {
        code,
        message,
        details,
      },
    });
  }
}
