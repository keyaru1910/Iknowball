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

    it('should login user', async () => {
        const req = { user: mockUser };
        const res = await controller.login(req, { email: 'test@example.com', password: 'password123' });
        expect(res.data).toBeDefined();
        expect(service.login).toHaveBeenCalledWith(mockUser);
    });
});
