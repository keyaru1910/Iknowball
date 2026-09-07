import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private authService: AuthService) {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/v1/auth/google/callback',
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const { id, name, emails, photos } = profile;
        const user = await this.authService.validateGoogleUser({
            googleId: id,
            email: emails[0].value,
            fullName: `${name.givenName || ''} ${name.familyName || ''}`.trim(),
            avatarUrl: photos && photos[0] ? photos[0].value : null,
        });
        done(null, user);
    }
}
