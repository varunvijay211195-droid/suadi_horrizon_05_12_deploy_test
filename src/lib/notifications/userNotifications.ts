import { sendEmail } from '@/lib/mail';
import { templates } from './emailTemplates';

export async function sendPasswordResetEmail(email: string, resetLink: string, name: string) {
    try {
        await sendEmail({
            to: email,
            subject: `Reset Your Password - Saudi Horizon`,
            html: templates.passwordReset(name, resetLink)
        });
        return { success: true };
    } catch (err) {
        console.error('Failed to send password reset email:', err);
        return { success: false, error: err };
    }
}

export async function sendWelcomeEmail(email: string, name: string) {
    try {
        await sendEmail({
            to: email,
            subject: 'Welcome to Saudi Horizon - Your Partner in Heavy Equipment',
            html: templates.welcome(name)
        });
        return { success: true };
    } catch (err) {
        console.error('Failed to send welcome email:', err);
        return { success: false, error: err };
    }
}

export async function sendOrderConfirmationEmail(email: string, name: string, orderDetails: any) {
    try {
        await sendEmail({
            to: email,
            subject: `Order Confirmation #${orderDetails.id.toString().slice(-8).toUpperCase()} - Saudi Horizon`,
            html: templates.orderConfirmation(name, orderDetails)
        });
        return { success: true };
    } catch (err) {
        console.error('Failed to send order confirmation email:', err);
        return { success: false, error: err };
    }
}

export async function sendQuoteConfirmationEmail(email: string, name: string, quoteId: string, company: string) {
    try {
        await sendEmail({
            to: email,
            subject: `Quote Request Received - Saudi Horizon`,
            html: templates.quoteConfirmation(name, quoteId, company)
        });
        return { success: true };
    } catch (err) {
        console.error('Failed to send quote confirmation email:', err);
        return { success: false, error: err };
    }
}

export async function sendOrderStatusUpdateEmail(email: string, name: string, orderId: string, status: string) {
    try {
        await sendEmail({
            to: email,
            subject: `Update for Order #${orderId.slice(-8).toUpperCase()} - Saudi Horizon`,
            html: templates.orderStatusUpdate(name, orderId, status)
        });
        return { success: true };
    } catch (err) {
        console.error('Failed to send order status update email:', err);
        return { success: false, error: err };
    }
}
