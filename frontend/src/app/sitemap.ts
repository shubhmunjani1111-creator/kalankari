import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://kalankari.com';
  
  const staticPages = [
    '',
    '/shop',
    '/about',
    '/contact',
    '/faq',
    '/exchange',
    '/privacy-policy',
    '/terms-conditions',
    '/refund-policy',
    '/shipping-policy',
    '/cancellation-policy',
  ];

  const sitemaps = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  return sitemaps;
}
