import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType?: string;
    }>;
}

export async function sendEmail({ to, subject, text, html, attachments }: SendEmailParams) {
    console.log(`[MAIL] Starting send to ${to} with subject: ${subject} via Resend`);
    try {
        const { data, error } = await resend.emails.send({
            from: `${process.env.SMTP_FROM_NAME || 'Saudi Horizon'} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
            to,
            subject,
            text: text || '',
            html: html || '',
            attachments: attachments?.map(a => ({
                filename: a.filename,
                content: a.content,
            })),
        });

        if (error) {
            console.error('[MAIL] Resend Error:', error);
            return { success: false, error };
        }

        console.log('[MAIL] Email sent successfully via Resend:', data?.id);
        return { success: true, messageId: data?.id };
    } catch (error) {
        console.error('[MAIL] Unexpected error sending email via Resend:', error);
        return { success: false, error };
    }
}
