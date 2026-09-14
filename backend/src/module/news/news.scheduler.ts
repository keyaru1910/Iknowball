import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service'; import { NewsService } from './news.service';
export const NEWS_QUEUE = 'news-rss';
@Injectable() export class NewsScheduler implements OnModuleInit { constructor(@InjectQueue(NEWS_QUEUE) private queue:Queue){} async onModuleInit(){ await this.queue.add('sync',{}, {jobId:'news-rss-initial',removeOnComplete:true}); await this.queue.add('sync',{}, {jobId:'news-rss-30-minutes',repeat:{every:30*60*1000},removeOnComplete:{count:50},removeOnFail:{count:100}}); } }
@Processor(NEWS_QUEUE) export class NewsProcessor extends WorkerHost { constructor(private news:NewsService,private prisma:PrismaService){super()} async process(_job:Job){const startedAt=new Date();try{const result=await this.news.syncAll();await this.prisma.syncJobLog.create({data:{jobName:'NEWS_RSS_SYNC',status:result.failed?'PARTIAL':'SUCCESS',startedAt,finishedAt:new Date(),recordsProcessed:result.recordsProcessed,errorMessage:result.failed?`${result.failed} nguồn lỗi`:null}});return result}catch(e:any){await this.prisma.syncJobLog.create({data:{jobName:'NEWS_RSS_SYNC',status:'FAILED',startedAt,finishedAt:new Date(),errorMessage:e.message}});throw e}} }
