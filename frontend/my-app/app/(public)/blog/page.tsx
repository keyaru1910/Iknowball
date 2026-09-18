"use client";

import React, { useState } from "react";
import Link from "next/link";
import { colors } from "../../lib/design-tokens";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: "data-science" | "tactics" | "model-ai" | "guide";
  categoryLabel: string;
  readTime: string;
  publishedAt: string;
  author: string;
  authorRole: string;
  coverEmoji: string;
  featured?: boolean;
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: "1",
    slug: "poisson-distribution-football-score-prediction",
    title: "Ứng Dụng Mô Hình Phân Phối Poisson Trong Dự Báo Tỷ Số Bóng Đá",
    excerpt: "Khám phá cách tính toán số bàn thắng kỳ vọng của đội chủ nhà và đội khách dựa trên hệ số tấn công và phòng ngự lịch sử qua phân phối Poisson độc lập.",
    category: "data-science",
    categoryLabel: "Data Science",
    readTime: "7 phút đọc",
    publishedAt: "15 Th09, 2026",
    author: "Ban Nghiên Cứu iKnowBall",
    authorRole: "AI Research Team",
    coverEmoji: "⚽",
    featured: true,
  },
  {
    id: "2",
    slug: "understanding-xg-expected-goals-deep-dive",
    title: "Bàn Thắng Kỳ Vọng (xG): Từ Tọa Độ Dứt Điểm Đến Xác Suất Thành Bàn",
    excerpt: "Phân tích cấu trúc mô hình xG: Khoảng cách, góc sút, loại đường chuyền kiến tạo và bộ phận dứt điểm tác động thế nào tới cơ hội ghi bàn thực tế.",
    category: "tactics",
    categoryLabel: "Phân Tích Chiến Thuật",
    readTime: "6 phút đọc",
    publishedAt: "12 Th09, 2026",
    author: "Trần Thế Khang",
    authorRole: "Senior Sports Data Analyst",
    coverEmoji: "🎯",
  },
  {
    id: "3",
    slug: "dynamic-elo-rating-for-european-clubs",
    title: "Hệ Thống Xếp Hạng Elo Động (Dynamic Elo) Chuẩn Hóa Theo Giải Đấu",
    excerpt: "Tại sao bảng xếp hạng điểm số truyền thống bị méo mó bởi lịch thi đấu? Cách Elo hiệu chỉnh theo sức mạnh đối thủ và chênh lệch bàn thắng.",
    category: "model-ai",
    categoryLabel: "Mô Hình AI",
    readTime: "5 phút đọc",
    publishedAt: "08 Th09, 2026",
    author: "Lê Hoàng Nam",
    authorRole: "ML Engineer",
    coverEmoji: "📈",
  },
  {
    id: "4",
    slug: "probability-calibration-curve-explained",
    title: "Calibration Curve: Khi Nào Con Số 70% Của AI Là Thực Sự Đáng Tin?",
    excerpt: "Hướng dẫn đọc biểu đồ cân chỉnh xác suất (Reliability Curve) và cách phát hiện một mô hình dự đoán bị 'Overconfident' trong thực tế.",
    category: "guide",
    categoryLabel: "Cẩm Nang",
    readTime: "8 phút đọc",
    publishedAt: "02 Th09, 2026",
    author: "Ban Nghiên Cứu iKnowBall",
    authorRole: "AI Research Team",
    coverEmoji: "🔬",
  },
  {
    id: "5",
    slug: "derby-matches-psychological-impact-on-ai-models",
    title: "Yếu Tố Tâm Lý Và Khán Giả Trong Các Trận Derby Ảnh Hưởng Đến AI Thế Nào?",
    excerpt: "Cách thuật toán iKnowBall tích hợp các tham số hiệu ứng sân nhà (Home Advantage Index) và các trận derby căng thẳng vào ma trận trọng số.",
    category: "tactics",
    categoryLabel: "Phân Tích Chiến Thuật",
    readTime: "5 phút đọc",
    publishedAt: "28 Th08, 2026",
    author: "Nguyễn Minh Tuấn",
    authorRole: "Football Analyst",
    coverEmoji: "🏟️",
  },
];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCat = selectedCategory === "all" || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const featuredPost = BLOG_POSTS.find((p) => p.featured);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-12">
      {/* Header */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          📰 Góc Nhìn Chuyên Sâu & Khoa Học Dữ Liệu
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          Blog Phân Tích Bóng Đá iKnowBall
        </h1>
        <p className="text-base sm:text-lg leading-relaxed" style={{ color: colors.textMuted }}>
          Tổng hợp các bài nghiên cứu về mô hình xác suất, khoa học dữ liệu thể thao, phân tích xG và đánh giá chiến thuật bằng số liệu định lượng.
        </p>
      </div>

      {/* Featured Post Card */}
      {featuredPost && (
        <div
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-10 transition-all duration-300 hover:border-emerald-500/40"
          style={{ borderColor: colors.border, backgroundColor: colors.panel }}
        >
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2.5 py-1 rounded-md font-semibold bg-emerald-500/20 text-emerald-300">
                  {featuredPost.categoryLabel}
                </span>
                <span className="text-neutral-400">• {featuredPost.readTime}</span>
                <span className="text-neutral-400">• {featuredPost.publishedAt}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white hover:text-emerald-400 transition-colors">
                {featuredPost.title}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>
                {featuredPost.excerpt}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-300 text-xs">
                  IK
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{featuredPost.author}</p>
                  <p className="text-[11px] text-neutral-400">{featuredPost.authorRole}</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center h-48 w-48 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-white/5 text-6xl select-none">
              {featuredPost.coverEmoji}
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: "all", label: "Tất cả bài viết" },
            { key: "data-science", label: "Data Science" },
            { key: "tactics", label: "Chiến thuật" },
            { key: "model-ai", label: "Mô hình AI" },
            { key: "guide", label: "Cẩm nang" },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedCategory === cat.key
                  ? "bg-emerald-500 text-neutral-950 font-semibold shadow-sm shadow-emerald-500/20"
                  : "bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm chủ đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-3.5 py-1.5 rounded-xl text-xs bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <article
            key={post.id}
            className="flex flex-col justify-between rounded-2xl border p-6 transition-all duration-200 hover:border-emerald-500/30 hover:-translate-y-1"
            style={{ borderColor: colors.border, backgroundColor: colors.panel }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{post.coverEmoji}</span>
                <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-white/5 text-emerald-400">
                  {post.categoryLabel}
                </span>
              </div>
              <h3 className="text-base font-bold text-white line-clamp-2 hover:text-emerald-400 transition-colors">
                {post.title}
              </h3>
              <p className="text-xs leading-relaxed line-clamp-3" style={{ color: colors.textMuted }}>
                {post.excerpt}
              </p>
            </div>

            <div className="pt-5 mt-5 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400">
              <span>{post.publishedAt}</span>
              <span>{post.readTime}</span>
            </div>
          </article>
        ))}
      </div>

      {/* Newsletter signup banner */}
      <div
        className="p-8 rounded-3xl border text-center space-y-4 max-w-2xl mx-auto"
        style={{ borderColor: colors.border, backgroundColor: colors.panelAlt }}
      >
        <h3 className="text-xl font-bold text-white">Nhận Bản Tin Phân Tích Hàng Tuần</h3>
        <p className="text-xs leading-relaxed text-neutral-400">
          Đăng ký để nhận các báo cáo chuyên sâu trước thềm vòng đấu Ngoại Hạng Anh, C1 và nhận định số liệu mới nhất trực tiếp qua Email.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center max-w-md mx-auto">
          <input
            type="email"
            placeholder="Địa chỉ email của bạn..."
            className="w-full px-4 py-2 rounded-xl text-xs bg-black/40 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-400 text-neutral-950 hover:bg-emerald-300 transition-colors shrink-0"
          >
            Đăng Ký
          </button>
        </div>
      </div>
    </div>
  );
}
