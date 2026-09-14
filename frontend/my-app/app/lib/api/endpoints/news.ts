import { apiFetch } from '../client';
export type NewsArticle={id:string;slug:string;sport:'FOOTBALL'|'BASKETBALL';category:string|null;sourceName:string;sourceUrl:string;title:string;excerpt:string|null;imageUrl:string|null;publishedAt:string|null;createdAt:string};
export const getNews=(params?:{sport?:string;category?:string;page?:number})=>{const q=new URLSearchParams();Object.entries(params||{}).forEach(([k,v])=>v&&q.set(k,String(v)));return apiFetch<NewsArticle[]>(`/news${q.size?`?${q}`:''}`)};
export const getNewsArticle=(slug:string)=>apiFetch<NewsArticle>(`/news/${encodeURIComponent(slug)}`);
