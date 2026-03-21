import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new Promise<NextResponse>((resolve) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: process.env.CLOUDINARY_FOLDER || 'saudi-horizon',
                    resource_type: 'auto',
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        resolve(
                            NextResponse.json({ error: 'Image upload failed' }, { status: 500 })
                        );
                    } else {
                        resolve(
                            NextResponse.json({
                                url: result?.secure_url,
                                public_id: result?.public_id,
                            })
                        );
                    }
                }
            );

            uploadStream.end(buffer);
        });


    } catch (error) {
        console.error('Error in upload route:', error);
        return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
    }
}
