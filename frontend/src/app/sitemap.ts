import { MetadataRoute } from 'next';
import { API_BASE_URL } from '@/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const staticSitemaps = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  let productSitemaps: any[] = [];
  try {
    const res = await fetch(`${API_BASE_URL}/api/products`, { cache: 'no-store' });
    if (res.ok) {
      const products = await res.json();
      productSitemaps = products.map((product: any) => ({
        url: `${baseUrl}/shop/${product.seo?.slug || product._id}`,
        lastModified: new Date(product.updatedAt || product.createdAt || new Date()),
        changeFrequency: 'daily' as const,
        priority: 0.6,
      }));
    }
  } catch (err) {
    console.error("Failed to fetch products for sitemap:", err);
  }

  return [...staticSitemaps, ...productSitemaps];
}
