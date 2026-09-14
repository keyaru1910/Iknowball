import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../shared/cache.service';
import { NEWS_SOURCES, NewsSource } from './news.sources';

type RssItem = { title: string; url: string; excerpt?: string; imageUrl?: string; publishedAt?: Date };
const decode = (v: string) => v.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();
const tag = (xml: string, name: string) => { const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i')); return m ? decode(m[1]) : undefined; };
export function parseRss(xml: string): RssItem[] { return [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].map((m): RssItem | null => { const item=m[0]; const title=tag(item,'title'); const url=tag(item,'link') || tag(item,'guid'); const media=item.match(/<(?:media:content|media:thumbnail|enclosure)[^>]+(?:url|href)=["']([^"']+)/i)?.[1]; const date=tag(item,'pubDate') || tag(item,'published'); return title && url ? { title, url, excerpt: tag(item,'description'), imageUrl: media, publishedAt: date && !Number.isNaN(Date.parse(date)) ? new Date(date) : undefined } : null; }).filter((x): x is RssItem => x !== null); }
const slugify = (title: string, url: string) => `${title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,100)}-${Buffer.from(url).toString('base64url').slice(-10)}`;

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  constructor(private prisma: PrismaService, private cache: CacheService) {}
  async list(query: { sport?: string; category?: string; page?: number; limit?: number }) { const page=Math.max(1, Number(query.page)||1), limit=Math.min(50,Math.max(1,Number(query.limit)||20)); const where:any={}; if (query.sport) where.sport=query.sport.toUpperCase(); if(query.category) where.category=query.category; const key=`news:${JSON.stringify({where,page,limit})}`; return this.cache.getOrSet(key, 300, async()=>{ const [items,total]=await this.prisma.$transaction([this.prisma.newsArticle.findMany({where,orderBy:[{publishedAt:'desc'},{createdAt:'desc'}],skip:(page-1)*limit,take:limit}),this.prisma.newsArticle.count({where})]); return {items,total,page,limit}; }); }
  async get(slug: string) { const article=await this.prisma.newsArticle.findUnique({where:{slug}}); if(!article) throw new NotFoundException('Không tìm thấy tin tức'); return article; }
  async syncAll() { let count=0, failed=0; for(const source of NEWS_SOURCES) { try { count+=await this.syncSource(source); } catch(e:any) { failed++; this.logger.warn(`RSS ${source.key}: ${e.message}`); } } await this.cache.delByPattern('news:*'); return { sources: NEWS_SOURCES.length, recordsProcessed: count, failed }; }
  async syncSource(source: NewsSource) { const response=await axios.get<string>(source.url,{timeout:15000,responseType:'text',headers:{'User-Agent':'iKnowBall RSS reader/1.0'}}); const items=parseRss(response.data); let count=0; for(const item of items) { await this.prisma.newsArticle.upsert({where:{sourceUrl:item.url},create:{slug:slugify(item.title,item.url),sport:source.sport,category:source.category,sourceName:source.name,sourceUrl:item.url,title:item.title,excerpt:item.excerpt?.slice(0,1000),imageUrl:item.imageUrl,publishedAt:item.publishedAt},update:{title:item.title,excerpt:item.excerpt?.slice(0,1000),imageUrl:item.imageUrl,publishedAt:item.publishedAt,syncedAt:new Date()}}); count++; } return count; }
  sources() { return NEWS_SOURCES.map(({key,sport,category,name})=>({key,sport,category,name})); }
}
