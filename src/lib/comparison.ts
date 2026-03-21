import { IProduct } from '@/types/product';

const MAX_COMPARISON_PRODUCTS = 6;
const STORAGE_KEY = 'comparison_products';

/**
 * Add product to comparison list
 */
export function addToComparison(productId: string, currentList: string[]): string[] {
    if (currentList.includes(productId)) {
        return currentList;
    }

    if (currentList.length >= MAX_COMPARISON_PRODUCTS) {
        throw new Error(`Maximum ${MAX_COMPARISON_PRODUCTS} products allowed for comparison`);
    }

    return [...currentList, productId];
}

/**
 * Remove product from comparison list
 */
export function removeFromComparison(productId: string, currentList: string[]): string[] {
    return currentList.filter(id => id !== productId);
}

/**
 * Clear all products from comparison
 */
export function clearComparison(): string[] {
    return [];
}

/**
 * Check if product is in comparison
 */
export function isInComparison(productId: string, currentList: string[]): boolean {
    return currentList.includes(productId);
}

/**
 * Check if comparison is full
 */
export function isComparisonFull(currentList: string[]): boolean {
    return currentList.length >= MAX_COMPARISON_PRODUCTS;
}

/**
 * Get comparison products count
 */
export function getComparisonCount(currentList: string[]): number {
    return currentList.length;
}

/**
 * Load comparison from localStorage
 */
export function loadComparisonFromStorage(): string[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading comparison from storage:', error);
        return [];
    }
}

/**
 * Save comparison to localStorage
 */
export function saveComparisonToStorage(productIds: string[]): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(productIds));
    } catch (error) {
        console.error('Error saving comparison to storage:', error);
    }
}

/**
 * Generate shareable comparison URL
 */
export function generateComparisonUrl(productIds: string[]): string {
    const params = new URLSearchParams();
    params.set('compare', productIds.join(','));
    return `${window.location.origin}/products?${params.toString()}`;
}

/**
 * Parse comparison IDs from URL
 */
export function parseComparisonFromUrl(searchParams: URLSearchParams): string[] {
    const compareParam = searchParams.get('compare');
    if (!compareParam) return [];

    return compareParam.split(',').filter(Boolean).slice(0, MAX_COMPARISON_PRODUCTS);
}

/**
 * Calculate difference highlights for comparison
 */
export interface ComparisonHighlight {
    productId: string;
    type: 'lowest_price' | 'highest_rating' | 'best_value' | 'in_stock';
}

export function calculateComparisonHighlights(products: IProduct[]): ComparisonHighlight[] {
    const highlights: ComparisonHighlight[] = [];

    if (products.length === 0) return highlights;

    // Find lowest price
    const lowestPrice = Math.min(...products.map(p => p.price));
    const lowestPriceProduct = products.find(p => p.price === lowestPrice);
    if (lowestPriceProduct) {
        highlights.push({
            productId: lowestPriceProduct.id,
            type: 'lowest_price'
        });
    }

    // Find highest rating
    const highestRating = Math.max(...products.map(p => p.rating || 0));
    const highestRatingProduct = products.find(p => (p.rating || 0) === highestRating);
    if (highestRatingProduct && highestRating > 0) {
        highlights.push({
            productId: highestRatingProduct.id,
            type: 'highest_rating'
        });
    }

    // Find in-stock products
    products.forEach(product => {
        if (product.inStock && product.stock > 0) {
            highlights.push({
                productId: product.id,
                type: 'in_stock'
            });
        }
    });

    return highlights;
}

/**
 * Export comparison data
 */
export interface ComparisonExportData {
    products: IProduct[];
    exportDate: string;
    comparisonUrl: string;
}

export function prepareComparisonExport(products: IProduct[]): ComparisonExportData {
    return {
        products,
        exportDate: new Date().toISOString(),
        comparisonUrl: generateComparisonUrl(products.map(p => p.id))
    };
}
