export interface IProduct {
    id: string;
    _id?: string;
    name: string;
    sku: string;
    brand: string;
    category: string;
    subcategory?: string | null;
    price: number;
    original_price?: number;
    image?: string | { url: string; alt?: string; public_id?: string } | null;
    gallery?: { url: string; alt?: string; public_id?: string }[];
    documents?: { url: string; name: string; type: string }[];
    description?: string;
    specs?: Record<string, string>;
    compatibility?: string[];
    inStock: boolean;
    in_stock: boolean;
    stock: number;
    rating?: number;
    reviews?: number;
    oemCode?: string;
    oem_code?: string;
    featured?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    created_at?: string;
    updated_at?: string;
}
