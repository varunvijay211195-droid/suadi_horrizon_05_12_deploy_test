import type { Metadata } from "next";
import { Inter, Space_Grotesk, Cairo } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import Providers from "./providers";
import { Layout } from "@/components/Layout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = cookieStore.get('i18next')?.value || 'en';

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://saudihorizon.com';

  if (lang === 'ar') {
    return {
      title: "الأفق السعودية - مورد قطع غيار المعدات الثقيلة",
      description: "الموزع المعتمد لقطع غيار المعدات الثقيلة في المملكة العربية السعودية. متخصصون في المحركات، الهيدروليك، ومكونات نقل الحركة.",
      keywords: ["قطع غيار", "معدات ثقيلة", "السعودية", "الرياض", "محركات", "هيدروليك", "ANC"],
      alternates: {
        canonical: baseUrl,
        languages: {
          'en-US': baseUrl,
          'ar-SA': baseUrl,
        },
      },
      openGraph: {
        title: "الأفق السعودية - مورد قطع غيار المعدات الثقيلة",
        description: "الموزع المعتمد لقطع غيار المعدات الثقيلة في المملكة العربية السعودية.",
        url: baseUrl,
        siteName: 'Saudi Horizon',
        locale: 'ar_SA',
        type: 'website',
      },
    };
  }

  return {
    title: "Saudi Horizon - Heavy Equipment Parts Supplier",
    description: "OEM-certified parts distributor for heavy equipment in Saudi Arabia. Authorized supplier of engine, hydraulic, and transmission components.",
    keywords: ["heavy equipment", "spare parts", "Saudi Arabia", "Riyadh", "engine parts", "hydraulic parts", "ANC"],
    alternates: {
      canonical: baseUrl,
      languages: {
        'en-US': baseUrl,
        'ar-SA': baseUrl,
      },
    },
    openGraph: {
      title: "Saudi Horizon - Heavy Equipment Parts Supplier",
      description: "OEM-certified parts distributor for heavy equipment in Saudi Arabia.",
      url: baseUrl,
      siteName: 'Saudi Horizon',
      locale: 'en_US',
      type: 'website',
    },
  };
}



export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = cookieStore.get('i18next')?.value || 'en';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://saudihorizon.com';

  return (
    <>
      <html lang={lang} dir={dir} suppressHydrationWarning>
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                "name": lang === 'ar' ? "سعودي هورايزون" : "Saudi Horizon",
                "image": `${baseUrl}/logo.png`,
                "@id": baseUrl,
                "url": baseUrl,
                "telephone": "+966570196677",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Building 8550, Omar bin Al-Khattab Street, Dallah Industrial District",
                  "addressLocality": "Dammam",
                  "addressRegion": "Eastern Province",
                  "postalCode": "34225",
                  "addressCountry": "SA"
                },
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": 26.4207,
                  "longitude": 50.0888
                },
                "openingHoursSpecification": {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Sunday"
                  ],
                  "opens": "08:00",
                  "closes": "20:00"
                }
              })
            }}
          />
        </head>
        <body
          className={`${inter.variable} ${spaceGrotesk.variable} ${cairo.variable} antialiased bg-navy font-sans`}
        >
          <Providers>
            <Layout>{children}</Layout>
          </Providers>
        </body>
      </html>
    </>
  );
}
