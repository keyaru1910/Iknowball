// notification/notification.service.ts
import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class NotificationService {
    private resend = new Resend(process.env.RESEND_API_KEY);

    async sendVerificationEmail(email: string, token: string) {
        const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

        const { error } = await this.resend.emails.send({
            from: 'iKnowBall <no-reply@iknowball.com>',
            to: email,
            subject: 'Xác thực email của bạn',
            html: `
        <p>Nhấn vào link bên dưới để xác thực email (hết hạn sau 24 giờ):</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
      `,
        });

        if (error) {
            throw new Error(`Không thể gửi email xác thực: ${error.message}`);
        }
    }
}
