import { describe, expect, it } from 'vitest';
import { parseRss } from './news.service';
describe('parseRss', () => { it('reads valid RSS items and skips malformed entries', () => { const articles=parseRss('<rss><item><title><![CDATA[Title]]></title><link>https://example.com/a</link><description><![CDATA[<b>Summary</b>]]></description></item><item><title>No URL</title></item></rss>'); expect(articles).toHaveLength(1); expect(articles[0]).toMatchObject({title:'Title',url:'https://example.com/a',excerpt:'Summary'}); }); });
