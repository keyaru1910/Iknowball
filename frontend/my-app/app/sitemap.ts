import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://iknowball.com';
  const currentDate = new Date().toISOString();

  // Danh sách các trang chính
  const routes = [
    '',
    '/matches',
    '/predictions',
    '/standings',
    '/statistics',
    '/vip',
    '/pricing',
    '/news',
    '/blog',
    '/alerts',
    '/developer',
    '/brier-score',
    '/log-loss',
    '/terms',
    '/privacy',
    '/disclaimer',
    '/login',
    '/register',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: route === '' || route === '/matches' || route === '/predictions' ? 'hourly' : 'daily',
    priority: route === '' ? 1.0 : route === '/predictions' || route === '/matches' ? 0.9 : 0.7,
  }));
}
