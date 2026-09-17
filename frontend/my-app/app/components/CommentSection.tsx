"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createComment, getComments, type Comment } from "../lib/api/endpoints/comments";
import { useAuth } from "../hooks/useAuth";
import UserBadge from "./UserBadge";
import { colors } from "../lib/design-tokens";

interface CommentRowProps {
  comment: Comment;
  onReply: (id: string) => void;
}

function CommentRow({ comment, onReply }: CommentRowProps) {
  const userName = comment.user?.fullName || "Người dùng iKnowBall";
  const initial = (userName[0] || "U").toUpperCase();
  const isVipOrPro = comment.user?.tier === "vip" || comment.user?.tier === "pro";

  return (
    <div className="border-t py-4" style={{ borderColor: colors.borderSoft }}>
      {/* Author Header */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0"
          style={{
            background: isVipOrPro ? "rgba(245,158,11,0.15)" : "rgba(47,217,140,0.15)",
            border: isVipOrPro ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(47,217,140,0.3)",
            color: isVipOrPro ? "#FBBF24" : colors.accent,
          }}
        >
          {initial}
        </div>
        <span className="text-sm font-semibold text-white">{userName}</span>
        <UserBadge tier={comment.user?.tier} size="xs" />
        <span className="text-[11px]" style={{ color: colors.textFaint }}>
          • {new Date(comment.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
        </span>
      </div>

      {/* Content */}
      <p className="mt-2 text-sm leading-relaxed text-neutral-200 whitespace-pre-wrap pl-9">
        {comment.content}
      </p>

      {/* Action footer */}
      <div className="mt-2 flex items-center gap-3 text-xs pl-9" style={{ color: colors.textMuted }}>
        <button
          type="button"
          onClick={() => onReply(comment.id)}
          className="font-medium text-emerald-400 hover:underline"
        >
          💬 Trả lời
        </button>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-9 mt-3 flex flex-col gap-3 border-l-2 pl-4" style={{ borderColor: `${colors.accent}30` }}>
          {comment.replies.map((reply) => {
            const replyName = reply.user?.fullName || "Người dùng iKnowBall";
            const replyInitial = (replyName[0] || "U").toUpperCase();
            const isReplyVipOrPro = reply.user?.tier === "vip" || reply.user?.tier === "pro";

            return (
              <div key={reply.id} className="py-2">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shrink-0"
                    style={{
                      background: isReplyVipOrPro ? "rgba(245,158,11,0.15)" : "rgba(47,217,140,0.15)",
                      border: isReplyVipOrPro ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(47,217,140,0.3)",
                      color: isReplyVipOrPro ? "#FBBF24" : colors.accent,
                    }}
                  >
                    {replyInitial}
                  </div>
                  <span className="text-xs font-semibold text-white">{replyName}</span>
                  <UserBadge tier={reply.user?.tier} size="xs" />
                  <span className="text-[10px]" style={{ color: colors.textFaint }}>
                    • {new Date(reply.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-300 pl-8">
                  {reply.content}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ entityId }: { entityId: string }) {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [parentId, setParentId] = useState<string>();

  const commentsQuery = useQuery({
    queryKey: ["comments", entityId],
    queryFn: () => getComments(entityId).then((r) => r.data),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  const mutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      setContent("");
      setParentId(undefined);
      queryClient.invalidateQueries({ queryKey: ["comments", entityId] });
    },
  });

  return (
    <section
      className="mt-10 rounded-xl border p-5 sm:p-6"
      style={{ borderColor: colors.border, backgroundColor: colors.panel }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>💬 Bình luận & Thảo luận</span>
          {commentsQuery.data && (
            <span
              className="text-xs font-normal px-2 py-0.5 rounded-full"
              style={{ backgroundColor: colors.panelAlt, color: colors.textMuted }}
            >
              {commentsQuery.data.length}
            </span>
          )}
        </h2>
      </div>

      {isAuthenticated ? (
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (content.trim()) mutation.mutate({ entityId, content, parentId });
          }}
        >
          {parentId && (
            <div
              className="mb-2 flex items-center justify-between rounded-lg px-3 py-1.5 text-xs"
              style={{ backgroundColor: `${colors.accent}15`, color: colors.accent }}
            >
              <span>Đang phản hồi một bình luận</span>
              <button
                type="button"
                onClick={() => setParentId(undefined)}
                className="hover:underline font-semibold"
              >
                ✕ Hủy phản hồi
              </button>
            </div>
          )}

          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={2000}
              placeholder={parentId ? "Viết câu trả lời của bạn..." : "Chia sẻ quan điểm, nhận định của bạn..."}
              className="min-h-24 w-full rounded-xl border p-3.5 text-sm text-white focus:outline-none focus:ring-1 transition-all resize-y"
              style={{
                borderColor: colors.borderSoft,
                backgroundColor: colors.panelAlt,
              }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs" style={{ color: colors.textMuted }}>
              <span>Đăng với tư cách: <strong className="text-white">{user?.fullName ?? user?.email}</strong></span>
              <UserBadge tier={user?.tier} role={user?.role} size="xs" />
            </div>

            <button
              type="submit"
              disabled={mutation.isPending || !content.trim()}
              className="rounded-lg px-4 py-2 text-xs font-bold transition-all disabled:opacity-50"
              style={{
                backgroundColor: colors.accent,
                color: colors.bg,
              }}
            >
              {mutation.isPending ? "Đang gửi..." : parentId ? "Gửi phản hồi" : "Đăng bình luận"}
            </button>
          </div>

          {mutation.error && (
            <p className="mt-2 text-xs text-rose-400">
              {(mutation.error as Error).message || "Đã xảy ra lỗi khi đăng bình luận."}
            </p>
          )}
        </form>
      ) : (
        <div
          className="mt-4 rounded-xl border p-4 text-center text-xs"
          style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}
        >
          <p style={{ color: colors.textMuted }}>
            Vui lòng{" "}
            <Link href="/login" className="font-semibold text-emerald-400 hover:underline">
              Đăng nhập
            </Link>{" "}
            để tham gia bình luận và nhận định cùng cộng đồng.
          </p>
        </div>
      )}

      {/* List Comments */}
      <div className="mt-6">
        {commentsQuery.isLoading ? (
          <div className="py-6 text-center text-xs" style={{ color: colors.textMuted }}>
            Đang tải bình luận...
          </div>
        ) : commentsQuery.data?.length ? (
          <div className="divide-y" style={{ borderColor: colors.borderSoft }}>
            {commentsQuery.data.map((c) => (
              <CommentRow key={c.id} comment={c} onReply={setParentId} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-lg border border-dashed py-8 text-center text-xs"
            style={{ borderColor: colors.borderSoft, color: colors.textMuted }}
          >
            Chưa có bình luận nào cho bài viết này. Hãy là người đầu tiên chia sẻ!
          </div>
        )}
      </div>
    </section>
  );
}

