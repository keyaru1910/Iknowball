import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { NewsService } from './news.service';
@Controller('api/v1/news') @Public()
export class NewsController { constructor(private readonly news: NewsService) {} @Get() async list(@Query() q:any) { const r=await this.news.list(q); return {data:r.items,meta:{total:r.total,page:r.page,limit:r.limit,totalPages:Math.ceil(r.total/r.limit)},error:null}; } @Get(':slug') async get(@Param('slug') slug:string) { return {data:await this.news.get(slug),meta:null,error:null}; } }
