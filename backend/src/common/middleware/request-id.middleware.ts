import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface RequestWithId extends Request {
    id?: string;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
    private readonly logger = new Logger('HTTP');

    use(req: RequestWithId, res: Response, next: NextFunction): void {
        const headerRequestId = req.headers['x-request-id'] as string;
        const requestId = headerRequestId || randomUUID();
        req.id = requestId;
        res.setHeader('x-request-id', requestId);

        const startTime = Date.now();

        res.on('finish', () => {
            const durationMs = Date.now() - startTime;
            const statusCode = res.statusCode;
            const logPayload = {
                timestamp: new Date().toISOString(),
                requestId,
                method: req.method,
                url: req.originalUrl || req.url,
                statusCode,
                durationMs: `${durationMs}ms`,
                userAgent: req.headers['user-agent'] || 'unknown',
                ip: req.ip || req.socket.remoteAddress || 'unknown',
            };

            if (statusCode >= 500) {
                this.logger.error(JSON.stringify(logPayload));
            } else if (statusCode >= 400) {
                this.logger.warn(JSON.stringify(logPayload));
            } else {
                this.logger.log(JSON.stringify(logPayload));
            }
        });

        next();
    }
}
