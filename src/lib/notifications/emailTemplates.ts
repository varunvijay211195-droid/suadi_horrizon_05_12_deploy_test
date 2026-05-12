
import { format } from 'date-fns';

const BRAND_COLOR = '#0A1628';
const GOLD_COLOR = '#C5A059';
const TEXT_COLOR = '#333333';
const BG_COLOR = '#F8F9FA';

/**
 * Base Wrapper for all emails to ensure consistent layout and branding
 */
const emailWrapper = (content: string, previewText: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Saudi Horizon</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: ${BG_COLOR}; color: ${TEXT_COLOR}; line-height: 1.6; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #eeeeee; }
        .header { background: ${BRAND_COLOR}; padding: 40px 20px; text-align: center; }
        .logo { color: ${GOLD_COLOR}; font-size: 28px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; margin: 0; }
        .tagline { color: #8B9DB8; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-top: 10px; }
        .content { padding: 45px; }
        .footer { background: ${BG_COLOR}; padding: 30px 20px; text-align: center; border-top: 1px solid #eeeeee; }
        .btn { display: inline-block; padding: 16px 36px; background-color: ${BRAND_COLOR}; color: ${GOLD_COLOR} !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border: 2px solid ${GOLD_COLOR}; transition: all 0.3s ease; }
        .btn-gold { background-color: ${GOLD_COLOR}; color: ${BRAND_COLOR} !important; border: none; }
        .h1 { color: ${BRAND_COLOR}; font-size: 24px; font-weight: 800; margin-bottom: 20px; }
        .p { margin-bottom: 20px; font-size: 15px; color: #555555; }
        .order-table { width: 100%; border-collapse: collapse; margin: 25px 0; }
        .order-table th { text-align: left; font-size: 12px; color: #999999; text-transform: uppercase; padding-bottom: 10px; border-bottom: 1px solid #eeeeee; }
        .order-table td { padding: 15px 0; border-bottom: 1px solid #eeeeee; vertical-align: top; }
        .total-row td { border-bottom: none; padding-top: 25px; }
        .badge { display: inline-block; padding: 6px 12px; background: #EBF7EE; color: #1E7E34; border-radius: 50px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div style="display: none; max-height: 0px; overflow: hidden;">${previewText}</div>
    <div class="container">
        <div class="header">
            <h1 class="logo">Saudi Horizon</h1>
            <div class="tagline">Heavy Equipment & Industrial Solutions</div>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p style="font-size: 12px; color: #999999; margin: 0;">&copy; ${new Date().getFullYear()} Saudi Horizon Trading Est. All rights reserved.</p>
            <p style="font-size: 11px; color: #aaaaaa; margin: 8px 0 0;">Bldg 8550, Omar Bin Al Khattab St, Dammam, KSA</p>
            <div style="margin-top: 20px;">
                <a href="#" style="color: ${GOLD_COLOR}; text-decoration: none; font-size: 11px; margin: 0 10px;">Privacy Policy</a>
                <a href="#" style="color: ${GOLD_COLOR}; text-decoration: none; font-size: 11px; margin: 0 10px;">Terms of Service</a>
            </div>
        </div>
    </div>
</body>
</html>
`;

export const templates = {
    // ─── AUTH TEMPLATES ──────────────────────────────────────────────────

    welcome: (name: string) => emailWrapper(`
        <div class="badge">Registration Successful</div>
        <h1 class="h1">Welcome to the Horizon, ${name}!</h1>
        <p class="p">Thank you for joining Saudi Horizon. We are dedicated to providing you with the highest quality heavy equipment spare parts and industrial solutions across the Kingdom.</p>
        <p class="p">Your account is now ready. Explore our vast inventory and start building your fleet today.</p>
        <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.NEXT_PUBLIC_URL}/login" class="btn">Explore Catalog</a>
        </div>
        <p class="p">If you need immediate assistance or have specific bulk requirements, our specialists are ready to help.</p>
    `, "Welcome to Saudi Horizon - Your account is now active"),

    passwordReset: (name: string, resetLink: string) => emailWrapper(`
        <h1 class="h1">Reset Your Password</h1>
        <p class="p">Hello ${name},</p>
        <p class="p">We received a request to reset the password for your Saudi Horizon account. Click the button below to choose a new password. This link will expire in 60 minutes for your security.</p>
        <div style="text-align: center; margin: 40px 0;">
            <a href="${resetLink}" class="btn btn-gold">Set New Password</a>
        </div>
        <p class="p" style="font-size: 13px; color: #999999;">If you didn't request this change, you can safely ignore this email. Your current password will remain unchanged.</p>
    `, "Password Reset Request for Saudi Horizon"),

    // ─── TRANSACTIONAL TEMPLATES ─────────────────────────────────────────

    orderConfirmation: (name: string, order: any) => {
        const items = order.order_items || [];
        const itemsHtml = items.map((item: any) => `
            <tr>
                <td style="width: 70px; padding-right: 15px;">
                    <img src="${item.products?.image || 'https://saudi-horizon.com/placeholder.png'}" width="60" height="60" style="border-radius: 8px; object-fit: cover; border: 1px solid #eeeeee;">
                </td>
                <td>
                    <div style="font-weight: bold; font-size: 14px; color: ${BRAND_COLOR};">${item.products?.name || 'Product'}</div>
                    <div style="font-size: 12px; color: #999999;">Qty: ${item.quantity} × SAR ${item.price?.toLocaleString()}</div>
                </td>
                <td style="text-align: right; font-weight: bold; font-size: 14px;">
                    SAR ${(item.price * item.quantity).toLocaleString()}
                </td>
            </tr>
        `).join('');

        return emailWrapper(`
            <div class="badge">Order Confirmed</div>
            <h1 class="h1">Your Order is Placed, ${name}</h1>
            <p class="p">Order ID: <span style="font-weight: bold; color: ${BRAND_COLOR};">#${order.id.toString().slice(-8).toUpperCase()}</span></p>
            <p class="p">We've received your order and our logistics team is currently preparing your parts for shipment. We will notify you as soon as they are on the way.</p>
            
            <table class="order-table">
                <thead>
                    <tr>
                        <th colspan="2">Item Details</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                    <tr class="total-row">
                        <td colspan="2" style="font-weight: 800; font-size: 16px; color: ${BRAND_COLOR};">Order Total</td>
                        <td style="text-align: right; font-weight: 800; font-size: 20px; color: ${GOLD_COLOR};">SAR ${order.total_amount?.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            <div style="background: #F8F9FA; padding: 25px; border-radius: 12px; margin-top: 30px;">
                <h3 style="margin-top: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #999999;">Delivery Address</h3>
                <p style="margin-bottom: 0; font-size: 14px; line-height: 1.6;">
                    ${order.shipping_address?.address || 'Standard Delivery'}<br>
                    ${order.shipping_address?.city || ''}, ${order.shipping_address?.country || 'Saudi Arabia'}<br>
                    T: ${order.shipping_address?.phone || ''}
                </p>
            </div>

            <div style="text-align: center; margin: 45px 0 10px;">
                <a href="${process.env.NEXT_PUBLIC_URL}/orders/track?id=${order.id}" class="btn">Track Order Progress</a>
            </div>
        `, `Order Confirmation #${order.id.toString().slice(-8).toUpperCase()} - Saudi Horizon`);
    },

    quoteConfirmation: (name: string, quoteId: string, company: string) => emailWrapper(`
        <div class="badge">Inquiry Received</div>
        <h1 class="h1">Quote Request Received</h1>
        <p class="p">Hello ${name},</p>
        <p class="p">Thank you for choosing Saudi Horizon for your business inquiry. We have received your quote request for <strong>${company}</strong> and it has been assigned to our specialized sales engineers.</p>
        <p class="p"><strong>Quote Reference:</strong> #${quoteId.toString().slice(-8).toUpperCase()}</p>
        <p class="p">Our team typically reviews industrial inquiries within 2-4 business hours. We will contact you shortly with the preliminary pricing and availability details.</p>
        <div style="background: #E8F0FE; padding: 20px; border-radius: 12px; margin: 30px 0;">
            <p style="margin: 0; font-size: 14px; color: ${BRAND_COLOR};"><strong>Next Steps:</strong> You will receive a notification via email once your quote is ready for review in your dashboard.</p>
        </div>
        <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.NEXT_PUBLIC_URL}/dashboard/quotes" class="btn">Manage My Inquiries</a>
        </div>
    `, "We've received your quote request - Saudi Horizon"),

    orderStatusUpdate: (name: string, orderId: string, status: string) => {
        const statusMap: any = {
            'processing': { title: 'Processing Order', text: 'Our warehouse team is currently picking and packing your items.', color: '#0066FF' },
            'shipped': { title: 'Order Shipped', text: 'Great news! Your order has been dispatched and is on its way to you.', color: '#00CC66' },
            'delivered': { title: 'Order Delivered', text: 'Your order has been successfully delivered. We hope you are satisfied with your parts.', color: '#1E7E34' },
            'cancelled': { title: 'Order Cancelled', text: 'Your order has been cancelled. If you didn\'t request this, please contact support.', color: '#FF3333' }
        };

        const config = statusMap[status.toLowerCase()] || { title: 'Order Update', text: `Your order status has been updated to ${status}.`, color: BRAND_COLOR };

        return emailWrapper(`
            <div class="badge" style="background: ${config.color}20; color: ${config.color}; border: 1px solid ${config.color}40;">${status.toUpperCase()}</div>
            <h1 class="h1">${config.title}</h1>
            <p class="p">Hello ${name},</p>
            <p class="p">There is an update regarding your order <strong>#${orderId.slice(-8).toUpperCase()}</strong>.</p>
            <p class="p" style="font-size: 16px; font-weight: bold; color: ${BRAND_COLOR};">${config.text}</p>
            <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.NEXT_PUBLIC_URL}/orders/track?id=${orderId}" class="btn">View Order History</a>
            </div>
            <p class="p">If you have any questions about this update, feel free to contact our customer support team.</p>
        `, `Update for your Order #${orderId.slice(-8).toUpperCase()} - Saudi Horizon`);
    }
};
