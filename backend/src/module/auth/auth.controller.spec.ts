import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AuthController', () => {
    let controller: AuthController;
    let service: any;

    const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        avatarUrl: null,
        emailVerifiedAt: new Date(),
        role: 'user',
        createdAt: new Date(),
    };

    beforeEach(async () => {
        service = {
            register: vi.fn().mockResolvedValue(mockUser),
            verifyEmail: vi.fn().mockResolvedValue(mockUser),
            login: vi.fn().mockResolvedValue({ user: mockUser, tokens: { accessToken: 'a', refreshToken: 'r' } }),
            refreshToken: vi.fn().mockResolvedValue({ user: mockUser, tokens: { accessToken: 'a2', refreshToken: 'r2' } }),
            logout: vi.fn().mockResolvedValue({ message: 'Đăng xuất thành công' }),
            forgotPassword: vi.fn().mockResolvedValue({ message: 'OK' }),
            resetPassword: vi.fn().mockResolvedValue({ message: 'OK' }),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [{ provide: AuthService, useValue: service }],
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should register user', async () => {
        const res = await controller.register({ email: 'test@example.com', password: 'password123' });
        expect(res.data).toEqual(mockUser);
        expect(service.register).toHaveBeenCalled();
    });

    it('should verify email', async () => {
        const res = await controller.verifyEmail('token123');
        expect(res.data).toEqual(mockUser);
        expect(service.verifyEmail).toHaveBeenCalledWith('token123');
    });

    it('should login user and set cookie if res available', async () => {
        const req = { user: mockUser };
        const res = { cookie: vi.fn() };
        const response = await controller.login(req, res, { email: 'test@example.com', password: 'password123' });
        expect(response.data).toBeDefined();
        expect(service.login).toHaveBeenCalledWith(mockUser);
        expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'r', expect.any(Object));
    });

    it('should refresh token from body or cookie', async () => {
        const req = { cookies: { refreshToken: 'cookie_refresh' } };
        const res = { cookie: vi.fn() };
        const response = await controller.refreshToken(req, res, {});
        expect(response.data).toBeDefined();
        expect(service.refreshToken).toHaveBeenCalledWith('cookie_refresh');
        expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'r2', expect.any(Object));
    });

    it('should logout user and clear cookie', async () => {
        const req = { cookies: { refreshToken: 'cookie_refresh' } };
        const res = { clearCookie: vi.fn() };
        const response = await controller.logout('user-1', req, res, {});
        expect(response.data).toEqual({ message: 'Đăng xuất thành công' });
        expect(service.logout).toHaveBeenCalledWith('user-1', 'cookie_refresh');
        expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/' });
    });
});
