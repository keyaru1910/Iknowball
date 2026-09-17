import { BadRequestException, ForbiddenException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CommentStatus, CommentableType, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../shared/cache.service';

function computeUserTier(user: any): 'free' | 'pro' | 'vip' | 'admin' {
  if (!user) return 'free';
  const roleName = user.role?.name ?? user.role ?? 'user';
  if (roleName === 'admin') return 'admin';
  const activeSub = user.subscriptions?.find((sub: any) =>
    [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING].includes(sub.status) &&
    (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) >= new Date()),
  ) || user.subscriptions?.[0];

  if (activeSub) {
    if ([SubscriptionPlan.VIP_MONTHLY, SubscriptionPlan.VIP_YEARLY].includes(activeSub.plan)) {
      return 'vip';
    }
    return 'pro';
  }
  if (roleName === 'premium') return 'pro';
  return 'free';
}

function mapCommentUser(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    tier: computeUserTier(user),
  };
}

const userSelectConfig = {
  select: {
    id: true,
    fullName: true,
    avatarUrl: true,
    role: { select: { name: true } },
    subscriptions: {
      where: { status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } },
      orderBy: { createdAt: 'desc' as const },
      take: 1,
      select: { plan: true, status: true, currentPeriodEnd: true },
    },
  },
};


@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService, private cache: CacheService) {}

  async list(entityType: CommentableType, entityId: string) {
    const rawComments: any[] = await this.prisma.comment.findMany({
      where: { entityType, entityId, status: CommentStatus.VISIBLE, parentId: null },
      include: {
        user: userSelectConfig as any,
        replies: {
          where: { status: CommentStatus.VISIBLE },
          include: { user: userSelectConfig as any },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rawComments.map((c) => ({
      id: c.id,
      entityId: c.entityId,
      entityType: c.entityType,
      content: c.content,
      createdAt: c.createdAt,
      isEdited: c.isEdited,
      user: mapCommentUser(c.user),
      replies: (c.replies || []).map((r: any) => ({
        id: r.id,
        entityId: r.entityId,
        entityType: r.entityType,
        content: r.content,
        createdAt: r.createdAt,
        isEdited: r.isEdited,
        user: mapCommentUser(r.user),
      })),
    }));
  }

  async create(userId: string, dto: { entityType: CommentableType; entityId: string; content: string; parentId?: string }) {
    if (!dto.content?.trim() || dto.content.trim().length > 2000) {
      throw new BadRequestException('Bình luận phải từ 1 đến 2000 ký tự');
    }
    if (dto.entityType !== CommentableType.NEWS_ARTICLE) {
      throw new BadRequestException('Loại nội dung chưa được hỗ trợ');
    }
    if (!(await this.prisma.newsArticle.findUnique({ where: { id: dto.entityId } }))) {
      throw new NotFoundException('Tin tức không tồn tại');
    }

    const n = await this.cache.increment(`rate:comment:${userId}`, 60);
    if (n !== null && n > 5) {
      throw new HttpException('Tối đa 5 bình luận mỗi phút', 429);
    }

    let depth = 0;
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({ where: { id: dto.parentId } });
      if (!parent || parent.entityId !== dto.entityId || parent.entityType !== dto.entityType) {
        throw new BadRequestException('Bình luận cha không hợp lệ');
      }
      if (parent.depth !== 0) {
        throw new BadRequestException('Chỉ hỗ trợ trả lời một cấp');
      }
      depth = 1;
    }

    const created: any = await this.prisma.comment.create({
      data: { ...dto, content: dto.content.trim(), userId, depth },
      include: { user: userSelectConfig as any },
    });

    return {
      id: created.id,
      entityId: created.entityId,
      entityType: created.entityType,
      content: created.content,
      createdAt: created.createdAt,
      isEdited: created.isEdited,
      user: mapCommentUser(created.user),
      replies: [],
    };
  }

  async edit(id: string, userId: string, content: string) {
    const c = await this.prisma.comment.findUnique({ where: { id } });
    if (!c) throw new NotFoundException();
    if (c.userId !== userId) throw new ForbiddenException();
    if (c.status === CommentStatus.DELETED) throw new BadRequestException('Bình luận đã bị xóa');
    return this.prisma.comment.update({ where: { id }, data: { content: content.trim(), isEdited: true } });
  }

  async remove(id: string, userId: string, isAdmin: boolean) {
    const c = await this.prisma.comment.findUnique({ where: { id } });
    if (!c) throw new NotFoundException();
    if (c.userId !== userId && !isAdmin) throw new ForbiddenException();
    return this.prisma.comment.update({ where: { id }, data: { status: CommentStatus.DELETED } });
  }

  async report(id: string, userId: string, reason: string) {
    try {
      return await this.prisma.commentReport.create({ data: { commentId: id, reporterId: userId, reason: reason.trim() } });
    } catch {
      throw new BadRequestException('Bạn đã báo cáo bình luận này');
    }
  }

  async reports() {
    return this.prisma.comment.findMany({
      where: { reports: { some: {} } },
      include: { user: { select: { id: true, email: true, fullName: true } }, reports: true },
      orderBy: { reports: { _count: 'desc' } },
    });
  }

  async moderate(id: string, status: CommentStatus) {
    return this.prisma.comment.update({ where: { id }, data: { status } });
  }
}

