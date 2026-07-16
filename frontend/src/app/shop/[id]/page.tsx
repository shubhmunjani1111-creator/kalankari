import { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';
import { API_BASE_URL } from '@/config';

type Props = {
  params: any;
};

// Fetch product details on server for metadata
async function getProduct(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = params && typeof params.then === 'function' ? await params : params;
  const product = await getProduct(resolvedParams.id);
  
  if (!product) {
    return {
      title: 'Product Details | Kalankari',
      description: 'Explore premium digital printed kurtis at Kalankari.',
    };
  }

  // Fallback defaults
  const title = product.seo?.metaTitle || `${product.name} | Kalankari`;
  const description = product.seo?.metaDescription || product.description || 'Premium hand-crafted Indian designer wear.';
  const keywords = product.seo?.keywords && product.seo.keywords.length > 0
    ? product.seo.keywords.join(', ')
    : `${product.category}, ${product.fabric}, Kalankari kurtis`;
  
  const imageUrl = product.images?.[0] || 'https://kalankari.com/logo.jpg';
  const canonicalUrl = `https://kalankari.com/shop/${product.seo?.slug || product._id || resolvedParams.id}`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: [{ url: imageUrl }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const resolvedParams = params && typeof params.then === 'function' ? await params : params;
  const product = await getProduct(resolvedParams.id);

  const jsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name,
    'image': product.images || ['https://kalankari.com/logo.jpg'],
    'description': product.seo?.metaDescription || product.description || 'Premium hand-crafted Indian designer wear.',
    'sku': product._id,
    'brand': {
      '@type': 'Brand',
      'name': 'Kalankari'
    },
    'offers': {
      '@type': 'Offer',
      'url': `https://kalankari.com/shop/${product.seo?.slug || product._id}`,
      'priceCurrency': 'INR',
      'price': product.price,
      'itemCondition': 'https://schema.org/NewCondition',
      'availability': product.stockCount > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    }
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient params={resolvedParams} />
    </>
  );
}
