import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://iknowball.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/payment/success',
          '/payment/cancel',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
