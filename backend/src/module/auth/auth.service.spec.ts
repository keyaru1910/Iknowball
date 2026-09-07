import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import * as bcrypt from 'bcrypt';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('bcrypt', async () => {
    return {
        hash: vi.fn().mockResolvedValue('hashed_password'),
        compare: vi.fn(),
    };
});

describe('AuthService', () => {
    let service: AuthService;
    let prisma: any;
    let jwtService: any;
    let notificationService: any;

    const mockUserRole = { id: 'role-1', name: 'user' };
    const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        fullName: 'Test User',
        avatarUrl: null,
        emailVerifiedAt: new Date(),
        roleId: 'role-1',
        role: mockUserRole,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        prisma = {
            user: {
                findUnique: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
            },
            role: {
                findUnique: vi.fn(),
                create: vi.fn(),
            },
            refreshToken: {
                create: vi.fn(),
                findMany: vi.fn(),
                update: vi.fn(),
                updateMany: vi.fn(),
            },
            oAuthAccount: {
                findUnique: vi.fn(),
                create: vi.fn(),
            },
            passwordResetToken: {
                create: vi.fn(),
            },
        };

        jwtService = {
            sign: vi.fn().mockReturnValue('mock_token'),
            verify: vi.fn(),
        };

        notificationService = {
            sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: prisma },
                { provide: JwtService, useValue: jwtService },
                { provide: NotificationService, useValue: notificationService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('register', () => {
        it('should throw ConflictException if email exists', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            await expect(
                service.register({ email: 'test@example.com', password: 'password123' }),
            ).rejects.toThrow(ConflictException);
        });

        it('should register a new user successfully', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.role.findUnique.mockResolvedValue(mockUserRole);
            prisma.user.create.mockResolvedValue(mockUser);

            const result = await service.register({
                email: 'test@example.com',
                password: 'password123',
                fullName: 'Test User',
            });

            expect(result).toBeDefined();
            expect(result.email).toBe('test@example.com');
            expect(prisma.user.create).toHaveBeenCalled();
            expect(notificationService.sendVerificationEmail).toHaveBeenCalled();
        });
    });

    describe('verifyEmail', () => {
        it('should verify email with valid token', async () => {
            jwtService.verify.mockReturnValue({ sub: 'user-1', purpose: 'verify-email' });
            prisma.user.update.mockResolvedValue(mockUser);

            const result = await service.verifyEmail('valid_token');
            expect(result).toBeDefined();
            expect(result.email).toBe('test@example.com');
        });

        it('should throw BadRequestException if token is invalid', async () => {
            jwtService.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            await expect(service.verifyEmail('invalid_token')).rejects.toThrow(BadRequestException);
        });
    });

    describe('validateUser', () => {
        it('should validate user with correct password', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

            const result = await service.validateUser('test@example.com', 'password123');
            expect(result).toBeDefined();
            expect(result.email).toBe('test@example.com');
        });

        it('should return null for incorrect password', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

            const result = await service.validateUser('test@example.com', 'wrongpassword');
            expect(result).toBeNull();
        });
    });

    describe('login', () => {
        it('should return tokens and user response', async () => {
            jwtService.sign.mockReturnValue('generated_token');
            prisma.refreshToken.create.mockResolvedValue({});

            const result = await service.login(mockUser);
            expect(result.tokens.accessToken).toBe('generated_token');
            expect(result.tokens.refreshToken).toBe('generated_token');
            expect(result.user.email).toBe('test@example.com');
        });
    });

    describe('refreshToken', () => {
        it('should throw UnauthorizedException for invalid refresh token', async () => {
            jwtService.verify.mockImplementation(() => {
                throw new Error();
            });
            await expect(service.refreshToken('invalid_refresh')).rejects.toThrow(UnauthorizedException);
        });
    });
});
