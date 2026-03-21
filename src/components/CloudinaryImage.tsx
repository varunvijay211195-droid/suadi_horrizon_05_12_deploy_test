'use client';

import { CldImage } from 'next-cloudinary';
import Image from 'next/image';

interface CloudinaryImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  crop?: any;
  quality?: string | number;
  format?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
}

export default function CloudinaryImage({
  src,
  alt,
  width,
  height,
  className,
  crop = 'fill',
  quality = 'auto',
  format = 'auto',
  priority = false,
  fill = false,
  sizes,
}: CloudinaryImageProps) {
  // Check if the src is a Cloudinary URL or public ID
  const isCloudinaryUrl = src.startsWith('https://res.cloudinary.com');
  
  if (isCloudinaryUrl) {
    // If it's already a Cloudinary URL, use Next.js Image
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        fill={fill}
        sizes={sizes}
      />
    );
  }

  // Use Cloudinary's CldImage component for optimized images
  return (
    <CldImage
      src={src}
      alt={alt}
      width={width || 800}
      height={height || 600}
      className={className}
      crop={crop}
      quality={quality}
      format={format}
      priority={priority}
      fill={fill}
      sizes={sizes}
    />
  );
}
