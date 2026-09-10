import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Patch,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { UpdateUserRoleDto, UpdateUserStatusDto } from './dto/admin-user.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('dashboard')
    @HttpCode(200)
    async getDashboardStats() {
        const result = await this.adminService.getDashboardStats();
        return { data: result, meta: null, error: null };
    }

    @Get('users')
    @HttpCode(200)
    async getUsers(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('search') search?: string,
        @Query('role') role?: string,
        @Query('status') status?: string,
    ) {
        const result = await this.adminService.getUsers({ page, limit, search, role, status });
        return { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages }, error: null };
    }

    @Patch('users/:id/status')
    @HttpCode(200)
    async updateUserStatus(
        @CurrentUser('id') adminId: string,
        @Param('id') targetUserId: string,
        @Body() dto: UpdateUserStatusDto,
        @Req() req: Request,
    ) {
        const ip = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const result = await this.adminService.updateUserStatus(adminId, targetUserId, dto, ip, userAgent);
        return { data: result, meta: null, error: null };
    }

    @Patch('users/:id/role')
    @HttpCode(200)
    async updateUserRole(
        @CurrentUser('id') adminId: string,
        @Param('id') targetUserId: string,
        @Body() dto: UpdateUserRoleDto,
        @Req() req: Request,
    ) {
        const ip = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const result = await this.adminService.updateUserRole(adminId, targetUserId, dto, ip, userAgent);
        return { data: result, meta: null, error: null };
    }

    @Get('payments')
    @HttpCode(200)
    async getPayments(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: any,
    ) {
        const result = await this.adminService.getPayments({ page, limit, status });
        return { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages }, error: null };
    }

    @Get('subscriptions')
    @HttpCode(200)
    async getSubscriptions(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: any,
    ) {
        const result = await this.adminService.getSubscriptions({ page, limit, status });
        return { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages }, error: null };
    }

    @Get('sync-jobs')
    @HttpCode(200)
    async getSyncJobs(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('jobName') jobName?: string,
    ) {
        const result = await this.adminService.getSyncLogs({ page, limit, jobName });
        return { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages }, error: null };
    }

    @Get('sync-logs')
    @HttpCode(200)
    async getSyncLogs(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('jobName') jobName?: string,
    ) {
        const result = await this.adminService.getSyncLogs({ page, limit, jobName });
        return { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages }, error: null };
    }

    @Get('model-performance')
    @HttpCode(200)
    async getModelPerformance(
        @Query('leagueId') leagueId?: string,
        @Query('modelVersion') modelVersion?: string,
    ) {
        const result = await this.adminService.getModelPerformance({ leagueId, modelVersion });
        return { data: result, meta: null, error: null };
    }

    @Get('audit-logs')
    @HttpCode(200)
    async getAuditLogs(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('action') action?: string,
    ) {
        const result = await this.adminService.getAuditLogs({ page, limit, action });
        return { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages }, error: null };
    }
}
