import { Metadata } from 'next';
import { getProductById } from '@/api/products';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://saudihorizon.com';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;

    try {
        const product = await getProductById(id);

        const title = product
            ? `${product.name} | Saudi Horizon`
            : 'Product Not Found | Saudi Horizon';

        const description = product
            ? `${product.description.substring(0, 160)} - ${product.brand ? `Buy ${product.brand} ` : ''}${product.name} at best prices.`
            : 'Product not found at Saudi Horizon.';

        const keywords = product
            ? [
                product.name,
                product.brand,
                product.category,
                'heavy equipment parts',
                'spare parts',
                'construction machinery',
            ].filter(Boolean).join(', ')
            : 'heavy equipment spare parts';

        return {
            title,
            description,
            keywords,
            openGraph: product ? {
                title,
                description,
                url: `${baseUrl}/products/${id}`,
                images: product?.image?.url ? [
                    {
                        url: product.image.url,
                        width: 1200,
                        height: 1200,
                        alt: product.name,
                    }
                ] : [],
                siteName: 'Saudi Horizon',
                locale: 'en_US',
            } : {
                type: 'website',
                title,
                description,
                url: `${baseUrl}/products/${id}`,
                images: [],
                siteName: 'Saudi Horizon',
                locale: 'en_US',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: product?.image?.url ? [product.image.url] : [],
            },
            alternates: {
                canonical: `${baseUrl}/products/${id}`,
            },
            robots: {
                index: true,
                follow: true,
            },
        };
    } catch (error) {
        console.error('Error generating product metadata:', error);

        return {
            title: 'Product Not Found | Saudi Horizon',
            description: 'The requested product could not be found.',
            robots: {
                index: false,
                follow: false,
            },
        };
    }
}

export async function generateJsonLd({ params }: Props) {
    const { id } = await params;

    try {
        const product = await getProductById(id);

        if (!product) return null;

        return {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            image: product.image,
            sku: product.sku,
            brand: {
                '@type': 'Brand',
                name: product.brand,
            },
            offers: {
                '@type': 'Offer',
                url: `${baseUrl}/products/${id}`,
                priceCurrency: 'USD',
                price: product.price,
                availability: product.in_stock
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                seller: {
                    '@type': 'Organization',
                    name: 'Saudi Horizon',
                    url: baseUrl,
                },
            },
            aggregateRating: product.rating
                ? {
                    '@type': 'AggregateRating',
                    ratingValue: product.rating,
                    reviewCount: product.reviews || 0,
                }
                : undefined,
        };
    } catch (error) {
        console.error('Error generating product JSON-LD:', error);
        return null;
    }
}
