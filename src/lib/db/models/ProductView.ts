
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductView extends Document {
    userId?: mongoose.Types.ObjectId;
    sessionId: string;
    productId: string;
    productName?: string;
    category?: string;
    brand?: string;
    referrer?: string;
    duration?: number; // Time spent on product page in seconds
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    viewedAt: Date;
}

const productViewSchema = new Schema<IProductView>(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        sessionId: {
            type: String,
            required: true,
            index: true,
        },
        productId: {
            type: String,
            required: true,
            index: true,
        },
        productName: {
            type: String,
        },
        category: {
            type: String,
            index: true,
        },
        brand: {
            type: String,
            index: true,
        },
        referrer: {
            type: String,
        },
        duration: {
            type: Number, // Seconds spent on product page
        },
        deviceType: {
            type: String,
            enum: ['desktop', 'mobile', 'tablet'],
            default: 'desktop',
        },
        viewedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: false, // We manage viewedAt manually
    }
);

// Indexes for marketing analytics queries
productViewSchema.index({ userId: 1, viewedAt: -1 });
productViewSchema.index({ productId: 1, viewedAt: -1 });
productViewSchema.index({ category: 1, viewedAt: -1 });
productViewSchema.index({ brand: 1, viewedAt: -1 });
productViewSchema.index({ sessionId: 1, viewedAt: -1 });

// TTL index - auto-delete after 90 days for privacy/data retention
productViewSchema.index({ viewedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Prevent model recompilation in development
const ProductView: Model<IProductView> = 
    mongoose.models.ProductView || mongoose.model<IProductView>('ProductView', productViewSchema);

export default ProductView;
